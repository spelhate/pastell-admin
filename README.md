# pastell-admin
Pastell Admin

## Sources

```shell
git clone https://github.com/spelhate/pastell-admin.git
```
## Installation front

```shell
cd /var/www/html
sudo ln -s /path_to/pastell-admin/web-app pastell-admin
```

## Installation back

```shell
cd pastell-admin
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=wsgi.py
export FLASK_DEBUG=1
export FLASK_ENV=development
cd api/
flask run  --port 5005
```
