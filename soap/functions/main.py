from firebase_functions import https_fn
from firebase_admin import initialize_app

from spyne import Application
from spyne.decorator import rpc
from spyne.protocol.soap import Soap11
from spyne.service import ServiceBase
from spyne.server.wsgi import WsgiApplication
from spyne.model.primitive import Unicode
from spyne.model.primitive import Integer
from spyne.model.complex import Iterable


class Service(ServiceBase):

  @rpc(Integer, Integer, Integer, _returns=Iterable(Integer))
  def calculTempsTrajet(ctx, distance, autonomie, chargement): # km, km, min
    vitesseMoyenne = 100 # km/h

    nbRecharges = distance // autonomie - 1
    tempsRecharge = nbRecharges * chargement # min
    tempsConduite = distance / vitesseMoyenne # h
    
    yield tempsRecharge + tempsConduite * 60


application = Application(
  [Service],
  'spyne.examples.hello.soap',
  in_protocol=Soap11(validator='lxml'),
  out_protocol=Soap11()
)

wsgi_application = WsgiApplication(application)

if __name__ == '__main__':
  from wsgiref.simple_server import make_server
  server = make_server('127.0.0.1', 8000, wsgi_application)
  print("running on port 8000")
  server.serve_forever()
  