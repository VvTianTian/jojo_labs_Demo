from pathlib import Path
import struct
import zlib

from PIL import Image

root = Path(__file__).resolve().parent.parent

def exact_apng(images, output, fps):
    images[0].save(output, format='PNG', save_all=True, append_images=images[1:],
                   duration=1000/fps, loop=0, disposal=0, blend=0)
    raw = output.read_bytes()
    out = bytearray(raw[:8])
    offset = 8
    controls = 0
    while offset < len(raw):
        length = struct.unpack('>I', raw[offset:offset+4])[0]
        kind = raw[offset+4:offset+8]
        data = bytearray(raw[offset+8:offset+8+length])
        if kind == b'fcTL':
            data[20:24] = struct.pack('>HH', 1, fps)
            controls += 1
        out.extend(struct.pack('>I', length))
        out.extend(kind)
        out.extend(data)
        out.extend(struct.pack('>I', zlib.crc32(kind+data) & 0xffffffff))
        offset += length+12
    if controls != len(images):
        raise ValueError(f'Expected {len(images)} frames, got {controls}')
    output.write_bytes(out)

for fps, count in ((24,30),(60,75)):
    files = sorted((root / f'frames-{fps}fps').glob('labs-loading-*.png'))
    if len(files) != count:
        raise ValueError(f'Expected {count} frames for {fps} fps, got {len(files)}')
    frames = [Image.open(p).convert('RGBA') for p in files]
    exact_apng(frames, root/f'labs-loading-preview-{fps}fps-transparent.png', fps)
    dark = []
    for frame in frames:
        background = Image.new('RGBA', frame.size, (79,85,88,255))
        background.alpha_composite(frame)
        dark.append(background)
    exact_apng(dark, root/f'labs-loading-preview-{fps}fps-dark.png', fps)

print('Saved 24 fps and 60 fps previews with exact APNG timing.')
