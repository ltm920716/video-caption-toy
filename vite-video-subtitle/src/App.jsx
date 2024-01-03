import React, { useState, useRef } from "react";
import VideoSubtitleAnnotate from "./apps/index.jsx";
import ReactPlayer from "react-player";
import ApiService from "./api.js";
import {
  Center,
  Heading,
  Button,
  Input,
  HStack,
  VStack,
  Spinner,
  useToast,
  Text,
} from "@chakra-ui/react";

function App() {
  const [video_ok, setVideoOk] = React.useState([false, false]);
  const fileInputRef = useRef(null);
  const [upload_ok, setUploadOk] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  const [userId, setUserId] = useState("admin123");
  const [videoId, setVideoId] = useState("");
  const [upVideoUrl, setUpVideoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [processingStatus, setProcessingStatus] = useState(["wait", 0, 0]);
  const [running, setRunning] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [oriVideoSize, setOriVideoSize] = useState({ width: 0, height: 0 });

  const handleFileChange = (event) => {
    // todo: parse MPEG-4 Video
    const file = event.target.files[0];

    const video = document.createElement("video");
    video.preload = "metadata";

    const handleMetadata = () => {
      // 验证视频时长
      const duration = video.duration; // 视频时长（以秒为单位）
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      setOriVideoSize({ width: originalWidth, height: originalHeight });

      if (duration > 300) {
        setVideoOk((prev) => [false, prev[1]]);
        toast({
          title: "视频时长超过300秒的限制",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      } else {
        setVideoOk((prev) => [true, prev[1]]);
      }
    };

    const metadataPromise = new Promise((resolve) => {
      video.addEventListener("loadedmetadata", () => {
        handleMetadata();
        resolve();
      });
    });

    // 验证视频大小
    const maxSizeInBytes = 50 * 1024 * 1024; // 最大可接受的文件大小（以字节为单位）
    if (file.size > maxSizeInBytes) {
      setVideoOk([video_ok[0], false]);
      toast({
        title: "视频文件大小超过50MB的限制",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    } else {
      setVideoOk([video_ok[0], true]);
    }

    video.src = URL.createObjectURL(file);
    setUpVideoUrl(video.src);
  };

  const handleUploadFile = async () => {
    if (video_ok[0] && video_ok[1]) {
      try {
        setLoading(true);
        const selectedFile = fileInputRef.current.files[0];
        // const fileID = await ApiService.fakeAPI();
        const fileID = await ApiService.uploadVideo(selectedFile);
        // console.log(`upload done: ${fileID}`);
        setVideoId(fileID);
        setUploadOk(true);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartErase = async (rects, videoSize, selectedMode) => {
    const adjustRectToBounds = (rect) => {
      const rectLeft = Math.max(rect.x, 0);
      const rectTop = Math.max(rect.y, 0);
      const rectRight = Math.min(rect.x + rect.width, videoSize.width);
      const rectBottom = Math.min(rect.y + rect.height, videoSize.height);

      const isRectInBounds = rectLeft < rectRight && rectTop < rectBottom;
      return isRectInBounds ? [rectLeft, rectTop, rectRight, rectBottom] : null;
    };

    // 对所有矩形进行调整
    const adjustedRects = rects
      .map(adjustRectToBounds)
      .filter((rect) => rect !== null);

    const widthRatio = oriVideoSize.width / videoSize.width;
    const heightRatio = oriVideoSize.height / videoSize.height;

    const mappedRects = adjustedRects.map((rect) => {
      const mappedX = rect[0] * widthRatio;
      const mappedY = rect[1] * heightRatio;
      const mappedWidth = (rect[2] - rect[0]) * widthRatio;
      const mappedHeight = (rect[3] - rect[1]) * heightRatio;

      return [mappedX, mappedY, mappedX + mappedWidth, mappedY + mappedHeight];
    });

    if (mappedRects.length > 0) {
      setRunning(true);
      const task_info = await ApiService.subtitleErase(videoId, mappedRects, selectedMode);
      // console.log("task info:", task_info);
      await handleGetVideo(task_info["task_id"]);
      setRunning(false);
    } else {
      toast({
        title: "没有符合要求的字幕标注",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }

    setVideoSize(videoSize);
  };

  const handleGetVideo = async (task_id) => {
    setVideoUrl("");

    try {
      await checkProcessingStatus(task_id);
      // console.log("task done, get video");
      await ApiService.getVideo(userId, task_id, setVideoUrl);
    } catch (error) {
      console.error("Error handling video:", error.message);
    }
  };

  const checkProcessingStatus = async (task_id) => {
    try {
      let status_ = "";
      do {
        const status = await ApiService.getVideoStatus(userId, task_id);
        setProcessingStatus([
          status["status"],
          status["index"],
          status["queue_num"],
        ]);
        status_ = status["status"];
        // console.log("processing status:", status_);

        await new Promise((resolve) => setTimeout(resolve, 5000));
      } while (status_ !== "completed");
    } catch (error) {
      console.error("Error checking processing status:", error.message);
    }
  };

  return (
    <div>
      {!upload_ok && (
        <Center height={"60vh"}>
          <VStack spacing={8}>
            <Heading>选择视频文件</Heading>

            <HStack spacing={4}>
              <Input
                type="file"
                accept=".mov, .mp4"
                onChange={handleFileChange}
                ref={fileInputRef}
                isDisabled={loading}
              />
              <Button
                colorScheme="blue"
                onClick={handleUploadFile}
                isDisabled={loading}
              >
                上传
              </Button>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              demo限制视频大小不超过50MB，时长不超过300秒
            </Text>
            {loading && <Spinner size="lg" color="blue" />}
          </VStack>
        </Center>
      )}

      {!running && upload_ok && !videoUrl && (
        <div>
          <VideoSubtitleAnnotate
            // url="https://www.w3schools.com/html/mov_bbb.mp4"
            url={upVideoUrl}
            onSubmit={handleStartErase}
          />
          <Center>
            <Button
              onClick={() => window.location.reload()}
              mt={4}
              border="2px solid #36A2EB"
              borderRadius="md"
              color="#36A2EB"
              backgroundColor="white"
              px={4}
              py={2}
              _hover={{ backgroundColor: "#36A2EB", color: "white" }}
            >
              重新上传
            </Button>
          </Center>
        </div>
      )}

      {running && (
        <Center height={"60vh"}>
          <VStack spacing={8}>
            <Heading>
              正在处理视频...排队中 {processingStatus[1]}/{processingStatus[2]}
            </Heading>
            <Spinner size="lg" color="blue" />
          </VStack>
        </Center>
      )}

      {!running && videoUrl && (
        <Center height={"60vh"} flexDirection="column" alignItems="center">
          <ReactPlayer
            url={videoUrl}
            width={videoSize[0]}
            height={videoSize[1]}
            controls
          />
          <Button
            onClick={() => window.location.reload()}
            mt={4}
            border="2px solid #36A2EB"
            borderRadius="md"
            color="#36A2EB"
            backgroundColor="white"
            px={4}
            py={2}
            _hover={{ backgroundColor: "#36A2EB", color: "white" }}
          >
            继续上传新文件
          </Button>
        </Center>
      )}
    </div>
  );
}

export default App;
