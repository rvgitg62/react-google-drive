import {useCallback, useEffect, useState} from "react";
import {useScriptLoader} from "./useScriptLoader";

export type OnError = (error: any) => void;

export interface GoogleDriveProps {
    clientId: string;
    apiKey: string;
    appId?: string;
    scope: string;
    token?: string;
}

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

export const useGoogleDrive = (
    {
        clientId,
        apiKey,
        appId,
        scope,
    }: GoogleDriveProps) => {
    const {loadScript} = useScriptLoader();
    const [tokenClient, setTokenClient] = useState<any>(null);

    /**
     * Callback after Google Identity Services are loaded.
     */
    const clientLoaded = useCallback(() => {
        if (window.google?.accounts?.oauth2) {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: scope,
                callback: '', // defined later
            });
            setTokenClient(client);
        } else {
            console.error("Google accounts oauth2 is not available yet.");
        }
    }, [clientId, scope]);

    /**
     * Callback after the API client is loaded.
     * Loads the discovery doc to initialize the API.
     */
    const initializePicker = useCallback(async () => {
        if (window.gapi?.client) {
            await (window as any).gapi.client.load(
                "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
            );
        } else {
            console.error("GAPI client is not available yet.");
        }
    }, []);

    const gapiLoaded = useCallback(() => {
        if (window.gapi) {
            window.gapi.load("client:picker", initializePicker);
        } else {
            console.error("window.gapi is undefined");
        }
    }, [initializePicker]);

    useEffect(() => {
        Promise.all([
            loadScript("https://apis.google.com/js/api.js"),
            loadScript("https://accounts.google.com/gsi/client"),
        ])
            .then(() => {
                gapiLoaded();
                clientLoaded();
            })
            .catch((error) => console.error("Error loading Google scripts", error));

    }, [clientLoaded, gapiLoaded, loadScript]);

    const getToken = useCallback((onGetToken: (token: string) => void, onError?: OnError) => {
        if (!tokenClient) {
            onError?.("Token client is not initialized");
            return;
        }

        tokenClient.callback = async (response: any) => {
            if (response.error !== undefined) {
                onError?.(response.error);
                throw response;
            }
            const accessToken = response.access_token;
            onGetToken(accessToken);
        };

        tokenClient.requestAccessToken({prompt: "consent"});
    }, [tokenClient]);

    const pickFile = useCallback(({token, folderId, onFilePicked, onError}: {
        token: string,
        folderId: string,
        onFilePicked: (result: any) => void,
        onError?: OnError
    }) => {
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes('image/png,image/jpeg,image/jpg');
        const uploadView = new window.google.picker.DocsUploadView();
        if (folderId) {
            view.setParent(folderId);
            uploadView.setParent(folderId);
        }

        const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setDeveloperKey(apiKey)
            .setAppId(appId)
            .setOAuthToken(token)
            .addView(view)
            .addView(uploadView)
            .setCallback(async (data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const document = data[window.google.picker.Response.DOCUMENTS][0];
                    const fileId = document[window.google.picker.Document.ID];
                    const res = await window.gapi.client.drive.files.get({
                        'fileId': fileId,
                        'fields': '*',
                    });
                    onFilePicked(res.result);
                } else {
                    onError?.(data);
                }
            })
            .build();
        picker.setVisible(true);
    }, [apiKey, appId]);

    const createFolder = useCallback(async (
        {
            folderName,
            onFolderCreated,
            onError,
        }: {
            folderName: string,
            onFolderCreated: (folderId: string) => void,
            onError?: OnError
        }) => {
        try {
            const response = await window.gapi.client.drive.files.create({
                resource: {
                    name: folderName,  // Set your folder name here
                    mimeType: "application/vnd.google-apps.folder",
                },
                fields: "id",
            });

            if (response.status === 200) {
                onFolderCreated(response.result.id);
            } else {
                onError?.(response.result);
            }
        } catch (error: any) {
            onError?.(error?.result?.error);
        }
    }, []);

    const downloadFile = useCallback(async (
        {
            token,
            fileId,
            onFileDownloaded,
            onError,
        }: {
            token: string,
            fileId: string,
            onFileDownloaded: (response: Response) => void,
            onError?: OnError
        }) => {
        try {
            const response: Response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );
            onFileDownloaded(response);
        } catch (error: any) {
            onError?.(error?.result?.error);
        }
    }, []);


    const uploadFile = useCallback(async (
        {
            file,
            folderId,
            token,
            onFileUploaded,
            onError,
        }: {
            file: File;
            folderId: string;
            token: string;
            onFileUploaded: (fileId: string, fileUrl: string) => void;
            onError?: OnError;
        }) => {

        const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: [folderId],  // Uploading to specific folder
        };

        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], {type: "application/json"}));
        form.append("file", file);

        try {
            const uploadResponse = await fetch(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                {
                    method: "POST",
                    headers: new Headers({Authorization: "Bearer " + token}),
                    body: form,
                }
            );

            const uploadData = await uploadResponse.json();

            if (uploadData.error) {
                onError?.(uploadData.error);
            }

            const fileId = uploadData.id;

            const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            onFileUploaded(fileId, fileUrl);

        } catch (error: any) {
            onError?.(error?.result?.error);
        }

    }, []);
    const changePermission = useCallback(async (
        {
            token,
            fileId,
            onPermissionChanged,
            onError,
        }: {
            token: string;
            fileId: string;
            onPermissionChanged: (permissionData: any) => void;
            onError?: OnError;
        }) => {
        try {
            const permissionResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
                {
                    method: "POST",
                    headers: new Headers({
                        Authorization: "Bearer " + token,
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        role: "reader", // Allows viewing
                        type: "anyone", // Public access
                    }),
                }
            );

            const permissionData = await permissionResponse.json();

            if (permissionData.error) {
                onError?.(permissionData.error);
            }

            onPermissionChanged(permissionData);
        } catch (e: any) {
            onError?.(e.result.error);
        }

    }, []);

    return {
        getToken,
        pickFile,
        createFolder,
        uploadFile,
        downloadFile,
        changePermission
    };
};
