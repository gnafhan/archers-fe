'use client'
// import Image from "next/image";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import React, { useState, useEffect, useRef } from "react";

export const VideoAI = ({source}) => {
    const [poseLandmarker, setPoseLandmarker] = useState(null);
    const [webcamRunning, setWebcamRunning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    function calculateAngle(a, b, c) {
      const toRadians = (degrees) => degrees * (Math.PI / 180);
      const toDegrees = (radians) => radians * (180 / Math.PI);
  
      const aArr = [a[0], a[1]]; // First
      const bArr = [b[0], b[1]]; // Mid
      const cArr = [c[0], c[1]]; // End
  
      const radians = Math.atan2(cArr[1] - bArr[1], cArr[0] - bArr[0]) - Math.atan2(aArr[1] - bArr[1], aArr[0] - bArr[0]);
      let angle = Math.abs(toDegrees(radians));
  
      if (angle > 180.0) {
          angle = 360 - angle;
      }
  
      return Math.round(angle * 1000) / 1000;
  }
  


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
              // console.log(landmark)
              drawingUtils.drawLandmarks(landmark,  {
                // radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
                color: 'red', lineWidth: 2, radius: 3 
              });
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#3240CF', lineWidth: 5 });

              const rightShoulder = [landmark[12].x, landmark[12].y]
              const rightHip = [landmark[24].x, landmark[24].y]
              const rightElbow = [landmark[14].x, landmark[14].y]
              const rightWirst = [landmark[16].x, landmark[16].y]
              const rightShoulderAngle = calculateAngle(rightElbow, rightShoulder, rightHip)
              const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWirst)
              const landmarkRightShoulder = landmark[12];
              const landmarkRightElbow = landmark[14]
              if (landmarkRightShoulder) {
                const { x, y } = landmarkRightShoulder;
                canvasCtx.fillStyle = "blue";
                canvasCtx.font = "20px Arial";
                canvasCtx.fillText(`sudut: ${rightShoulderAngle}`, x * canvasElement.width, y * canvasElement.height);
              }
              if (landmarkRightElbow) {
                const { x, y } = landmarkRightElbow;
                canvasCtx.fillStyle = "blue";
                canvasCtx.font = "20px Arial";
                canvasCtx.fillText(`sudut: ${rightElbowAngle}`, x * canvasElement.width, y * canvasElement.height);
              }


              const leftShoulder = [landmark[11].x, landmark[11].y]
              const leftHip = [landmark[23].x, landmark[23].y]
              const leftElbow = [landmark[13].x, landmark[13].y]
              const leftWirst = [landmark[15].x, landmark[15].y]
              const leftShoulderAngle = calculateAngle(leftElbow, leftShoulder, leftHip)
              const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWirst)
              const landmarkleftShoulder = landmark[11];
              const landmarkleftElbow = landmark[13];
              if (landmarkleftShoulder) {
                const { x, y } = landmarkleftShoulder;
                canvasCtx.fillStyle = "blue";
                canvasCtx.font = "20px Arial";
                canvasCtx.fillText(`sudut: ${leftShoulderAngle}`, x * canvasElement.width, y * canvasElement.height);
              }
              if (landmarkleftElbow) {
                const { x, y } = landmarkleftElbow;
                canvasCtx.fillStyle = "blue";
                canvasCtx.font = "20px Arial";
                canvasCtx.fillText(`sudut: ${leftElbowAngle}`, x * canvasElement.width, y * canvasElement.height);
              }

            const manubrium = [
                (leftShoulder[0] + rightShoulder[0]) / 2,
                (leftShoulder[1] + rightShoulder[1]) / 2
            ] 

            const nose = [landmark[0].x, landmark[0].y]

            const angleRightNeck = calculateAngle(nose, manubrium, rightShoulder)
            const angleLeftNeck = calculateAngle(nose, manubrium, leftShoulder)

            
            const leftEar = landmark[7];
            if (leftEar) {
              const { x, y } = leftEar;
              canvasCtx.fillStyle = "red";
              canvasCtx.font = "20px Arial";
              canvasCtx.fillText(`sudut: ${angleLeftNeck}`, x * canvasElement.width, y * canvasElement.height);
            }

            const rightEar = landmark[10];
            if (rightEar) {
              const { x, y } = rightEar;
              canvasCtx.fillStyle = "red";
              canvasCtx.font = "20px Arial";
              canvasCtx.fillText(`sudut: ${angleRightNeck}`, x * canvasElement.width, y * canvasElement.height);
            }





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
