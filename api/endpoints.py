from .middlewares import login_required
from flask import Flask, json, g, request
from flask_cors import CORS
import requests, urllib, logging
from logging.handlers import TimedRotatingFileHandler
from requests.auth import HTTPBasicAuth


app = Flask(__name__, instance_relative_config=True)
CORS(app)

FORMATTER = logging.Formatter("%(asctime)s — %(name)s — %(levelname)s — %(message)s")
LOG_FILE = "../pastell-admin.log"

app.config.from_object('config')
u = app.config['PASTELL_USER']
p = app.config['PASTELL_PASSWORD']
root_url = app.config['PASTELL_URL']
PASTELL_ENTITIES = {}
#Store the link between user id and entity id
PASTELL_SESSIONS = {}
#logs
logger = logging.getLogger('pastell-admin')
logger.setLevel(logging.DEBUG) # better to have too much log than not enough
file_handler = TimedRotatingFileHandler(LOG_FILE, when='midnight')
file_handler.setFormatter(FORMATTER)
logger.addHandler(file_handler)
# with this pattern, it's rarely necessary to propagate the error up to parent
logger.propagate = False



@app.route("/version", methods=["GET"])
@login_required
def version():
  ressource = '/version'
  PArequest = requests.get(root_url + ressource, auth=HTTPBasicAuth(u, p))
  data = json.loads(PArequest.text)
  return json_response({'pastel': data['version_complete']})

@app.route("/entite", methods=["GET"])
@login_required
def entites():
  global PASTELL_ENTITIES
  return json_response({'entities': PASTELL_ENTITIES})

@app.route("/role/<string:id_u>/<string:id_e>", methods=["POST","GET"])
@login_required
def Roles(id_u, id_e):
  if request.method == 'POST':
    #logger.info = g
    roles = request.get_json()
    ressource = '/utilisateur/%s/role' % id_u
    results = [];
    for role in roles:
      params = { 'role' : role, 'id_e': id_e }
      PArequest = requests.post(root_url + ressource, data=params, auth=HTTPBasicAuth(u, p))
      result = json.loads(PArequest.text)
      results.append({'role': role, 'result': result})
      if 'status' in result:
        if result['status'] == 'error':
          if 'error-message' in result:
            logger.warning('%s - %s - %s - %s' % (g.username, id_u, "Ajout rôles", result['error-message'] ))

    logger.info('%s - %s - %s - %s' % (g.username, id_u, "Ajout rôles",  json.dumps(results)))
    return json_response({'user': id_u, 'actions': results})
  elif request.method == 'GET':
    ressource = '/utilisateur/%s/role' % id_u
    PArequest = requests.get(root_url + ressource, auth=HTTPBasicAuth(u, p))
    data = json.loads(PArequest.text)
    return json_response({'user': id_u, 'roles': data})




@app.route("/entite_users/<string:id_e>", methods=["GET"])
@login_required
def users(id_e):
  ressource = '/utilisateur?id_e=%s' % id_e
  PArequest = requests.get(root_url + ressource, auth=HTTPBasicAuth(u, p))
  data = json.loads(PArequest.text)
  return json_response({'users': data})

def json_response(payload, status=200):
 return (json.dumps(payload), status, {'content-type': 'application/json'})


def getAllPastellEntities():
  global PASTELL_ENTITIES
  ressource = '/entite'
  request = requests.get(root_url + ressource, auth=HTTPBasicAuth(u, p))
  data = json.loads(request.text)
  for index, entity in enumerate(data):
    e = entity['id_e']
    PASTELL_ENTITIES[e] = entity

  logger.info('Referentiel des entités chargé')


getAllPastellEntities()

