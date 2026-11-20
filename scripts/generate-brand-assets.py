from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
out=Path('public');out.mkdir(exist_ok=True)
logo=Image.open('logo-2048.png').convert('RGBA');logo=logo.crop(logo.getbbox())
def mark(size,color):
 m=logo.copy();m.thumbnail(size,Image.Resampling.LANCZOS)
 ink=Image.new('RGBA',m.size,color);ink.putalpha(m.getchannel('A'));return ink
for size,name in [(16,'favicon-16.png'),(32,'favicon-32.png'),(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:
 canvas=Image.new('RGBA',(size,size),'#050505');m=mark((int(size*.65),int(size*.75)),'#f6f5f2');canvas.alpha_composite(m,((size-m.width)//2,(size-m.height)//2));canvas.save(out/name)
canvas=Image.open(out/'icon-512.png');canvas.save(out/'favicon.ico',sizes=[(16,16),(32,32),(48,48)])
im=Image.new('RGBA',(1200,630),'#f6f5f2');d=ImageDraw.Draw(im)
for x in range(60,1200,135):d.line((x,0,x,630),fill='#deddd8',width=1)
d.rectangle((0,0,325,630),fill='#050505');m=mark((195,300),'#f6f5f2');im.alpha_composite(m,((325-m.width)//2,(630-m.height)//2))
bold='/System/Library/Fonts/Supplemental/Arial Bold.ttf';regular='/System/Library/Fonts/Supplemental/Arial.ttf'
d.text((380,92),'RUDRA VAGHELA',font=ImageFont.truetype(regular,22),fill='#242424')
for y,line in [(175,'CODE.'),(265,'MOTION.'),(355,'CURIOSITY.')]:d.text((376,y),line,font=ImageFont.truetype(bold,77),fill='#050505')
d.text((382,508),'Web · AI · Embedded systems · Creative development',font=ImageFont.truetype(regular,21),fill='#444444')
d.line((382,565,1135,565),fill='#050505',width=2)
im.convert('RGB').save(out/'social-preview.png',optimize=True)
