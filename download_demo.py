import os, re, urllib.request, http.cookiejar
file_id='182VNx4bkgeKxqWv5Yx3kzRDIzwI9boqt'
url=f'https://docs.google.com/uc?export=download&id={file_id}'
ctx = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(ctx))
response = opener.open(url)
data = response.read()
try:
    content = data.decode('utf-8', errors='ignore')
    match = re.search(r'confirm=([0-9A-Za-z_]+)', content)
except Exception:
    match = None
if match:
    confirm = match.group(1)
    url = f'https://docs.google.com/uc?export=download&confirm={confirm}&id={file_id}'
    response = opener.open(url)
    data = response.read()
out = 'public/demo/demo.mp4'
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'wb') as f:
    f.write(data)
print('downloaded', len(data), 'bytes')
