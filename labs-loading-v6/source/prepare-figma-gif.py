from pathlib import Path
import os
import subprocess
import tempfile

from PIL import Image

root = Path(__file__).resolve().parent.parent

with tempfile.TemporaryDirectory(prefix='labs-figma-') as temp:
    env = os.environ.copy()
    env['LABS_GIF_PREVIEW'] = '1'
    env['LABS_GIF_OUTPUT_ROOT'] = temp
    subprocess.run([env.get('LABS_NODE_BINARY','node'), str(root/'source'/'generate.mjs')],
                   env=env, check=True)
    paths = sorted((Path(temp)/'frames-50fps').glob('labs-loading-*.png'))
    if len(paths) != 63:
        raise ValueError(f'Expected 63 GIF frames, got {len(paths)}')
    frames = [Image.open(p).convert('RGBA') for p in paths]

    # One common palette keeps colors consistent across frames. GIF only has
    # binary transparency, so the high-quality RGBA PNGs remain the master.
    atlas = Image.new('RGB', (309*4,309*4), (0,0,0))
    for j in range(16):
        atlas.paste(frames[j*len(frames)//16].convert('RGB'),
                    ((j%4)*309,(j//4)*309))
    q = atlas.quantize(colors=255, method=Image.Quantize.MEDIANCUT,
                       dither=Image.Dither.NONE)
    palette = [0,0,0]+q.getpalette()[:255*3]
    palette += [0]*(768-len(palette))
    master = Image.new('P',(1,1))
    master.putpalette(palette)

    transparent, dark = [], []
    for frame in frames:
        indexed = frame.convert('RGB').quantize(palette=master, dither=Image.Dither.NONE)
        indexed.paste(0, mask=frame.getchannel('A').point(lambda a: 255 if a<128 else 0))
        indexed.info['transparency'] = 0
        transparent.append(indexed)
        background = Image.new('RGBA',frame.size,(79,85,88,255))
        background.alpha_composite(frame)
        dark.append(background.convert('RGB').quantize(colors=256,
                    method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE))

    transparent[0].save(root/'labs-loading-figma-transparent.gif', save_all=True,
        append_images=transparent[1:], duration=20, loop=0, transparency=0,
        background=0, disposal=2, optimize=False)
    dark[0].save(root/'labs-loading-figma-dark-preview.gif', save_all=True,
        append_images=dark[1:], duration=20, loop=0, disposal=2, optimize=False)

print('Saved Figma GIF: 63 frames at 50 fps, 1.26 s per loop.')
