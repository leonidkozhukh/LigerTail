# local admin: 
# http://localhost:8080/_ah/admin/interactive
# To clear local DB, simply delete 
# ./WEB-INF/appengine-generated/local_db.bin

# delete Item
# run until not empty:
from model import Item
query = Item.all()
entries =query.fetch(1000)
db.delete(entries)

# delete Viewer
# run until not empty
from model import Viewer
query = Viewer.all()
entries =query.fetch(1000)
db.delete(entries)
