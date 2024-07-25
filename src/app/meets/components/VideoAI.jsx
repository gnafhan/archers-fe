'use client'
// import Image from "next/image";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import React, { useState, useEffect, useRef } from "react";

export const VideoAI = ({source}) => {
    const [poseLandmarker, setPoseLandmarker] = useState(null);
    const [webcamRunning, setWebcamRunning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);


    const enableWebcam = async () => {
        if (!poseLandmarker) {
          console.log("Wait! poseLandmaker not loaded yet.");
          return;
        }
    
        if (webcamRunning) {
          setWebcamRunning(false);
        } else {
          setWebcamRunning(true);
          const constraints = {
            video: true,
          };
    
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoRef.current.srcObject = source;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      };

      const predictWebcam = async () => {
        const canvasElement = canvasRef.current;
        const videoElement = videoRef.current;
        const canvasCtx = canvasElement.getContext("2d");
        const drawingUtils = new DrawingUtils(canvasCtx);
    
        if (poseLandmarker.runningMode === "IMAGE") {
          poseLandmarker.setOptions({ runningMode: "VIDEO" });
        }
    
        let lastVideoTime = -1;
    
        const predict = async () => {
          if (lastVideoTime !== videoElement.currentTime) {
            canvasElement.width = videoElement.clientWidth
            canvasElement.height = videoElement.clientHeight
            lastVideoTime = videoElement.currentTime;
            const result = await poseLandmarker.detectForVideo(videoElement, performance.now());
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            for (const landmark of result.landmarks) {
              console.log(landmark)
              drawingUtils.drawLandmarks(landmark,  {
                // radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
                color: 'red', lineWidth: 2, radius: 3 
              });
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#3240CF', lineWidth: 5 });
              // const landmark12 = landmark[12];
              // if (landmark12) {
              //   const { x, y } = landmark12;
              //   canvasCtx.fillStyle = "blue";
              //   canvasCtx.font = "20px Arial";
              //   canvasCtx.fillText("Hello World", x * canvasElement.width, y * canvasElement.height);
              // }
            }
          }
    
          if (true) {
            requestAnimationFrame(predict);
          }
        };
    
        predict();
      };

    useEffect(() => {
        const createPoseLandmarker = async () => {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
          );
          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 2,
          });
          setPoseLandmarker(landmarker);
        };
    
        createPoseLandmarker();
      }, []);


      useEffect(()=>{
        enableWebcam()
      },[poseLandmarker])
  return (
    <>
        {/* <div> */}
        <div className="" style={{ position: "relative", width: '100%', height: '100%' }}>
            {/* <button onClick={enableWebcam} className="absolute top-0 bottom-0 left-0 right-0 z-10 self-center h-full px-3 py-2 font-sans text-lg font-semibold">Check</button> */}
            <video ref={videoRef} className="absolute top-0 object-cover rounded-xl" style={{ width: "100%", height: "100%" }} autoPlay playsInline />
            <canvas ref={canvasRef} className="absolute top-0 output_canvas" />
          </div>
        {/* </div> */}
    </>
  )
}
