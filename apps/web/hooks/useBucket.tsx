import { DriveFile, DriveFolder, Provider, UploadingFile } from "@util/types";
import useFirebase from "./useFirebase";
import useKeys from "./useKeys";
import useS3 from "./useS3";
import useS3Shared from "./sharedBuckets/useS3Shared";

export type ContextValue = {
  loading: boolean;
  currentFolder: DriveFolder;
  folders: DriveFolder[];
  files: DriveFile[];
  uploadingFiles: UploadingFile[];
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>;
  addFolder: (name: string) => void;
  removeFolder: (folder: DriveFolder) => Promise<void>;
  addFile: (files: File[] | FileList) => Promise<any>;
  removeFile: (file: DriveFile) => Promise<boolean>;
};

export const ROOT_FOLDER: DriveFolder = {
  name: "",
  fullPath: "",
  parent: null,
  bucketName: null,
  bucketUrl: null,
};

export default function useBucket(): ContextValue {
  const { keys } = useKeys();

  if (Provider[keys.type] === Provider.firebase) {
    return useFirebase();
  } else if (Provider[keys.type] === Provider.s3) {
    return keys.permissions === "owned" ? useS3() : useS3Shared();
  } else if (Provider[keys.type] === Provider.backblaze) {
    return keys.permissions === "owned" ? useS3() : useS3Shared();
  } else if (Provider[keys.type] === Provider.cloudflare) {
    return keys.permissions === "owned" ? useS3() : useS3Shared();
  }

  return null;
}
