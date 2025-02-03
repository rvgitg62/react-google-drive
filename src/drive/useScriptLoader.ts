import {useCallback} from "react";

export const useScriptLoader = () => {
    const loadScript = useCallback((url: string, async: boolean = true, defer: boolean = true): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Check if the script is already present
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                resolve(url);
                return;
            }

            const script = document.createElement("script");
            script.src = url;
            script.async = async;
            script.defer = defer;

            script.onload = () => resolve(url);
            script.onerror = () => reject(new Error(`Error loading script: ${url}`));

            document.head.appendChild(script);
        });
    }, []);

    return {loadScript};
};
