import sys
sys.path.insert(0, 'backend')
from app.main import app
from mangum import Mangum

handler = Mangum(app)