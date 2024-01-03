import axios from "axios";

const apiUrl = import.meta.env.VITE_API_BASE_URL;
// const apiUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');


class ApiService {
  static async uploadVideo(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${apiUrl}/upload_video`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;
      if (response.status === 200) {
        const filePath = result.data;
        return filePath;
      } else {
        const error = result.msg;
        console.error("Error uploading file:", error);
        throw new Error("Upload failed. Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("Failed to upload video from the server");
    }
  }

  static async subtitleErase(filePath, rects, mode='static') {
    const selectedMode = mode === "slow" ? "dynamic" : "static";
    const data = {
      file_path: filePath,
      regions: rects,
      mode: selectedMode
    };

    try {
      const response = await axios.post(`${apiUrl}/subtitle_erase`, data);
      const result = await response.data;

      if (response.status === 200) {
        const task_info = result.data;
        return task_info;
      } else {
        const error = result.msg;
        console.error("Error erasing file:", error);
        throw new Error("Erase failed. Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error erasing file:", error);
      throw new Error("Failed to erase video from the server");
    }
  }

  static async getVideoStatus(userID, taskID) {
    const data = {
      user_id: userID,
      task_id: taskID,
    };
    try {
      const response = await axios.post(`${apiUrl}/status`, data);
      const result = response.data;
      return result.data;
    } catch (error) {
      console.error("Error getting status:", error);
      throw new Error("Failed to get status from the server");
    }
  }

  static async getVideo(userID, taskID, setVideoUrl) {
    const data = {
      user_id: userID,
      task_id: taskID,
    };

    try {
      const response = await axios.post(`${apiUrl}/get_video`, data, {
        responseType: "blob",
      });
  
      const videoBlob = new Blob([response.data], { type: "video/mp4" });
      const videoObjectURL = URL.createObjectURL(videoBlob);
      setVideoUrl(videoObjectURL);
    } catch (error) {
      console.error("Error fetching video:", error.message);
    }
  }

  static async fakeAPI() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ msg: "Fake API response after 5 seconds" });
      }, 5000);
    });
  }
}

export default ApiService;
