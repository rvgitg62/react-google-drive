import './App.css';
import React from "react";
import {useGoogleDrive} from "./drive/useGoogleDrive";

const SCOPES = 'SCOPES';
const CLIENT_ID = 'CLIENT_ID';
const API_KEY = 'API_KEY';
const APP_ID = 'APP_ID';

export const App = () => {

    const folderId = 'root';
    const [token, setToken] = React.useState<string | null>(null);
    const [folderName, setFolderName] = React.useState<string | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [fileId, setFileId] = React.useState<string | null>(null);

    const {getToken, pickFile, createFolder, uploadFile, changePermission} = useGoogleDrive(
        {
            clientId: CLIENT_ID,
            apiKey: API_KEY,
            appId: APP_ID,
            scope: SCOPES
        }
    );

    return (
        <div className="App">
            <button onClick={
                () => getToken((token) => {
                    console.log("Token----", token);
                    setToken(token);
                })}
            >Get token
            </button>
            <button onClick={
                () => {
                    if (token) {
                        pickFile({token, folderId, onFilePicked: (result) => console.log("File picked", result)});
                    } else {
                        console.error("Token is not available");
                    }
                }
            }>Pick file
            </button>
            <div className={'section'}>
                <input placeholder={'Enter folder name'} onChange={
                    (event) => {
                        setFolderName(event.target.value);
                    }}
                />
                <button onClick={
                    async () => {
                        if (token) {
                            await createFolder({
                                folderName: folderName || 'New folder',
                                onFolderCreated: (result) => {
                                    console.log("Folder created", result)
                                }
                            });
                        } else {
                            console.error("Token is not available");
                        }
                    }
                }>Create folder
                </button>
            </div>
            <div className={'section'}>
                <input type={'file'} onChange={(event) => {
                    console.log(event.target.files);
                    setFile(event.target.files ? event.target.files[0] : null);
                }}/>
                <button onClick={
                    async () => {
                        if (token && file) {
                            await uploadFile({
                                token,
                                file,
                                folderId,
                                onFileUploaded: (fileId, fileUrl) => {
                                    console.log("File uploaded", fileUrl);
                                    setFileId(fileId);
                                }
                            });
                        } else {
                            console.error("Token or file is not available");
                        }
                    }
                }>Upload file
                </button>
            </div>

            <div className={'section'}>
                {fileId && <span>Change permission for File Id: {fileId}</span>}
                <button onClick={
                    async () => {
                        if (token) {
                            await changePermission({
                                token,
                                fileId,
                                onPermissionChanged: (data) => console.log("Permission changed", data)
                            });
                        } else {
                            console.error("File is not available");
                        }
                    }
                }>Change Permission
                </button>
            </div>
        </div>
    );
}
