import { constraints } from "@/config"

export const openMediaDevices = async () => {
    return await navigator.mediaDevices.getUserMedia(constraints)
}

export const isMobile = ()=>{
    return /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)
}
