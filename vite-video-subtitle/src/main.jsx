import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.jsx";
// import VideoSubtitleAnnotate from '../lib/video-subtitle-annotate.js'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
      {/* <VideoSubtitleAnnotate url="https://www.w3schools.com/html/mov_bbb.mp4" width={600} height={300}/> */}
    </ChakraProvider>
  </React.StrictMode>
);
