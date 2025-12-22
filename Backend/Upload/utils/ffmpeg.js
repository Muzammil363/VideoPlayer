import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Step 1: Detect resolution using ffprobe
const getVideoResolution = (inputPath) => {
  return new Promise((resolve, reject) => {
    const cmd = `ffprobe -v error -show_streams -of json "${inputPath}"`;
    exec(cmd, (err, stdout) => {
      if (err) return reject(err);
      try {
        const { streams } = JSON.parse(stdout);
        const videoStream = streams.find(s => s.codec_type === "video");
        const hasAudio = streams.some(s => s.codec_type === "audio");
        resolve({ width: videoStream.width, height: videoStream.height, hasAudio });
      } catch (e) {
        reject(e);
      }
    });
  });
};


// Step 2: Define available presets
const HLS_PRESETS = [
  { label: "360p", width: 640, height: 360, bitrate: "800k" },
  { label: "480p", width: 854, height: 480, bitrate: "1400k" },
  { label: "720p", width: 1280, height: 720, bitrate: "2800k" },
  { label: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
];

// Step 3: Main HLS segmenter
export const segmentToHLS = async (inputPath, outputFolder) => {
  try {
    // Ensure output directory exists
    // fs.mkdirSync(outputFolder, { recursive: true });

    // Detect input resolution
    const { height: inputHeight,hasAudio } = await getVideoResolution(inputPath);

    // Filter only valid presets
    const selectedPresets = HLS_PRESETS.filter(p => p.height <= inputHeight);
    if (selectedPresets.length === 0) throw new Error("Input resolution too low for any preset");

    // Build command parts
    const filterLines = [];
    const mapLines = [];
    const varMap = [];

    selectedPresets.forEach((preset, index) => {
      filterLines.push(`-filter:v:${index} scale=w=${preset.width}:h=${preset.height}`);
      filterLines.push(`-c:v:${index} libx264 -b:v:${index} ${preset.bitrate}`);

      // video mapping
      mapLines.push(`-map 0:v:0`);
      if (hasAudio) mapLines.push(`-map 0:a`);

      // var stream map
      if (hasAudio) {
        varMap.push(`v:${index},a:${index}`);
      } else {
        varMap.push(`v:${index}`);
      }
    });


    const cmd = `
      ffmpeg -i "${inputPath}" \
      ${filterLines.join(" ")} \
      ${mapLines.join(" ")} \
      -f hls -hls_time 6 -hls_playlist_type vod \
      -hls_segment_filename "${outputFolder}/%v/segment%d.ts" \
      -master_pl_name "master.m3u8" \
      -var_stream_map "${varMap.join(" ")}" \
      "${outputFolder}/%v/output.m3u8"
    `.replace(/\s+/g, " ").trim(); // flatten spaces

    return await new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg Error:", stderr);
          return reject(error);
        }
        return resolve(path.join(outputFolder, "master.m3u8"));
      });
    });
  } catch (err) {
    console.error("segmentToHLS failed:", err);
    throw err;
  }
};
