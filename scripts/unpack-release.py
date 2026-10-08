import hashlib,json,subprocess,zipfile,sys
from pathlib import Path,PurePosixPath
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
name=f'safe_{version}_source.zip'
archive=root/'release-artifacts'/name
checksum=hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+name+'\n'
assert (archive.parent/(name+'.sha256')).read_text(encoding='utf-8')==checksum
assert (archive.parent/'SHA256SUMS').read_text(encoding='utf-8')==checksum
out=Path(sys.argv[1]).resolve()
assert not out.exists(), 'Consumer output already exists; choose a fresh directory.'
prefix=f'safe-{version}/'
with zipfile.ZipFile(archive) as z:
 entries=z.infolist(); names=[e.filename for e in entries]
 assert len(names)==len(set(names))
 assert len(z.comment)==40 and all(c in b'0123456789abcdef' for c in z.comment)
 for e in entries:
  assert e.filename.startswith(prefix)
  p=PurePosixPath(e.filename)
  assert not p.is_absolute() and '..' not in p.parts and '\\' not in e.filename
  assert (e.external_attr>>16)&0o170000 != 0o120000
 if (root/'.git').exists():
  git=lambda *a:subprocess.check_output(['git',*a],cwd=root)
  assert z.comment.decode()==git('rev-parse','HEAD').decode().strip()
  tracked=git('ls-files','-z').decode().split('\0')[:-1]
  assert sorted(e.filename[len(prefix):] for e in entries if not e.is_dir())==sorted(tracked)
  for item in tracked:assert z.read(prefix+item)==git('show','HEAD:'+item)
 z.extractall(out)
source=out/f'safe-{version}'
assert json.loads((source/'package.json').read_text(encoding='utf-8'))['license']=='MIT'
assert (source/'LICENSE').is_file() and (source/'pnpm-lock.yaml').is_file()
print(str(source))
