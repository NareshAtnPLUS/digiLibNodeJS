const { webapp } = require('./config');



webapp.listen(webapp.get('port'),'0.0.0.0',function(){
    console.log(`Server Started Running at ${webapp.get('port')}`);
})