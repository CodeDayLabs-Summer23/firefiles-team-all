import { Box, Center, Divider, Text, useColorMode } from "@chakra-ui/react";
import UploadFileButton from "@components/files/UploadFileButton";
import FolderBreadCrumbs from "@components/folders/FolderBreadCrumbs";
import Navbar from "@components/ui/Navbar";
import useBucket from "@hooks/useBucket";
import useKeys from "@hooks/useKeys";
import { Provider } from "@util/types";
import React, { useEffect, useMemo, useState } from "react";
import Dropzone from "react-dropzone";
import LoadingOverlay from "react-loading-overlay";
import UploadProgress from "./files/UploadProgress";
import GridView from "./GridView";
import ListView from "./ListView";
import { DriveFile } from "@util/types";
import { sortBy, each, has } from "underscore";

const baseStyle = {
	outline: "none",
	transition: "border .2s ease-in-out",
};

const activeStyle = {
	borderWidth: 2,
	borderRadius: 2,
	borderStyle: "dashed",
	borderColor: "#2196f3",
	backgroundColor: "rgba(0, 0, 0, 0.25)",
};

export type FileSortConfig = {
	property: "name" | "size" | "createdAt";
	isAscending: boolean;
}

const Dashboard = () => {
	const [draggedFilesToUpload, setDraggedFilesToUpload] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [isFolderDeleting, setIsFolderDeleting] = useState(false);
	const { currentFolder, files, folders, loading, uploadingFiles } = useBucket();
	const { colorMode } = useColorMode();
	const style = useMemo(() => ({ ...baseStyle, ...(isDragging ? activeStyle : {}) }), [isDragging]);
	const [gridView, setGridView] = useState(false);
	const [fileSort, setFileSort] = useState<FileSortConfig>({property: "name", isAscending: true});

	useEffect(() => {
		const storedView = localStorage.getItem("grid_view");
		const storedFileSort = localStorage.getItem("file_sort");

		if (storedView) setGridView(storedView === "true");
		if (storedFileSort) {
			setFileSort(JSON.parse(storedFileSort));
			console.log(storedFileSort);
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("grid_view", gridView.toString());
	}, [gridView]);

	useEffect(() => {
		localStorage.setItem("file_sort", JSON.stringify(fileSort));
	}, [fileSort]);

	const sortByProperty = () => {
		// console.log(files);
		if (files.some((item) => !has(item, fileSort.property))) return;

		const sortedFiles = sortBy(files, fileSort.property);
		if (!fileSort.isAscending) sortedFiles.reverse();
		each(files, (_item, i) => {files[i] = {...sortedFiles[i]}});
		// console.log('sorted on ' + fileSort.property);
	};

	return (
		<>
			<LoadingOverlay
				active={isFolderDeleting}
				spinner={true}
				text={`Deleting Files... \nPlease DO NOT close this tab.`}
			>
				<Dropzone
					onDrop={(files) => {
						setDraggedFilesToUpload(files);
						setIsDragging(false);
					}}
					noClick
					onDragOver={() => setIsDragging(true)}
					onDragLeave={() => setIsDragging(false)}
				>
					{({ getRootProps, getInputProps }) => (
						<Box
							{...getRootProps({
								style,
							})}
							minH="93vh"
						>
							<input {...getInputProps()} />
							<Text
								hidden={!isDragging}
								fontSize={["2xl", "3xl", "3xl"]}
								opacity="0.9"
								color={colorMode === "light" ? "gray.700" : "gray.300"}
								fontWeight="700"
								align="center"
								pos="absolute"
								top="50%"
								left="50%"
								w="full"
								transform="translate(-50%, -50%)"
								p="0"
								px="2"
								m="0"
							>
								DROP FILES ANYWHERE ON THE SCREEN
							</Text>
							<Navbar />
							<FolderBreadCrumbs currentFolder={currentFolder} />
							<Divider />
							{files?.length > 0 && sortByProperty()}
							{!gridView ? (
								<ListView
									loading={loading}
									currentFolder={currentFolder}
									files={files}
									folders={folders}
									setGridView={setGridView}
									setIsFolderDeleting={setIsFolderDeleting}
									setFileSort={setFileSort}
									fileSort={fileSort}
								/>
							) : (
								<GridView
									loading={loading}
									currentFolder={currentFolder}
									files={files}
									folders={folders}
									setGridView={setGridView}
									setIsFolderDeleting={setIsFolderDeleting}
									setFileSort={setFileSort}
									fileSort={fileSort}
								/>
							)}
						</Box>
					)}
				</Dropzone>
				<UploadFileButton
					filesToUpload={draggedFilesToUpload}
					setFilesToUpload={setDraggedFilesToUpload}
				/>
			</LoadingOverlay>
			{uploadingFiles.length > 0 && (
				<Center>
					<Box
						borderRadius="sm"
						px="4"
						pos="fixed"
						bottom="5%"
						width={["90vw", "60vw", "60vw"]}
						boxShadow="3.8px 4.1px 6.3px -1.7px rgba(0, 0, 0, 0.2)"
						backgroundColor={colorMode === "dark" ? "gray.700" : "white"}
					>
						{uploadingFiles.map((uploading) => (
							<UploadProgress key={uploading.id} file={uploading} />
						))}
					</Box>
				</Center>
			)}
		</>
	);
};

export default Dashboard;
