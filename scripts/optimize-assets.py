#!/usr/bin/env python3
import os
import subprocess

print("Starting asset compression and conversion...")

# 1. Convert and compress images to WebP
images = [
    # (src, dest, max_dim_filter, quality)
    ("Finger Roulette Background.jpg", "Finger Roulette Background.webp", "scale='min(1080,iw)':-2", 84),
    ("Chibi Bomb Game.jpg", "Chibi Bomb Game.webp", "scale='min(1280,iw)':-2", 85),
    ("Chibi Fingers Game.jpg", "Chibi Fingers Game.webp", "scale='min(1280,iw)':-2", 85),
    ("Chibi Spinning Bottle.jpg", "Chibi Spinning Bottle.webp", "scale='min(1280,iw)':-2", 85),
    ("PICK'U PARTY LOGO E01.png", "PICK'U PARTY LOGO E01.webp", "scale='min(1400,iw)':-2", 90),
    ("PICK'U PARTY APP ICON.png", "PICK'U PARTY APP ICON.webp", "scale=512:512", 90),
    ("Btl_E_001.jpg", "Btl_E_001.webp", "scale=-2:'min(1200,ih)'", 85),
    ("Btl_E_002.jpg", "Btl_E_002.webp", "scale=-2:'min(1200,ih)'", 85),
    ("Btl_E_003.jpg", "Btl_E_003.webp", "scale=-2:'min(1200,ih)'", 85),
    ("Btl_E_004.jpg", "Btl_E_004.webp", "scale=-2:'min(1200,ih)'", 85),
]

img_dir = "src/assets/images"
for src_name, dest_name, scale_filter, q in images:
    src_path = os.path.join(img_dir, src_name)
    dest_path = os.path.join(img_dir, dest_name)
    if os.path.exists(src_path):
        print(f"Converting image {src_name} -> {dest_name}...")
        cmd = [
            "ffmpeg", "-y", "-i", src_path,
            "-vf", scale_filter,
            "-q:v", str(q),
            dest_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error converting {src_name}: {res.stderr}")
        else:
            orig_sz = os.path.getsize(src_path) / 1024
            new_sz = os.path.getsize(dest_path) / 1024
            print(f"  Done: {orig_sz:.1f} KB -> {new_sz:.1f} KB ({(1 - new_sz/orig_sz)*100:.1f}% reduction)")

# 2. Re-encode and compress videos to optimized H.264 with faststart
videos = [
    ("Chibi DJ Neon Party Animation.mp4", "Chibi DJ Neon Party Animation.opt.mp4", 25),
    ("Finger Roulette Background Animation.mp4", "Finger Roulette Background Animation.opt.mp4", 25),
    ("Music Visualizer Spectrum Circle Animated.mp4", "Music Visualizer Spectrum Circle Animated.opt.mp4", 24),
]

vid_dir = "src/assets/videos"
for src_name, dest_name, crf in videos:
    src_path = os.path.join(vid_dir, src_name)
    dest_path = os.path.join(vid_dir, dest_name)
    if os.path.exists(src_path):
        print(f"Re-encoding video {src_name} -> {dest_name} with CRF {crf}...")
        cmd = [
            "ffmpeg", "-y", "-i", src_path,
            "-c:v", "libx264",
            "-crf", str(crf),
            "-preset", "medium",
            "-movflags", "+faststart",
            "-an",
            dest_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error compressing {src_name}: {res.stderr}")
        else:
            orig_sz = os.path.getsize(src_path) / (1024 * 1024)
            new_sz = os.path.getsize(dest_path) / (1024 * 1024)
            print(f"  Done: {orig_sz:.2f} MB -> {new_sz:.2f} MB ({(1 - new_sz/orig_sz)*100:.1f}% reduction)")
            # Replace original video with optimized video
            os.replace(dest_path, src_path)
            print(f"  Replaced original {src_name} with optimized file.")

print("Asset compression and conversion completed!")
