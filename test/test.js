var smock = require('../lib');

// sample data
var CUSTOMERS = {
    '1': { id: '1', firstName: 'John', lastName: 'Doe' }
};

// add a login handler
smock.route('/api/login')
    .method('POST')
      // options can be evaluated using this.options('requiresLogin') - we'll see how this is used later with the plugins
      .options({
          requiresLogin: false
      })
      // called when a request to this route is made
      // request, reply are standard HAPI objects (http://hapijs.com/api#route-handler)
      .onRequest(function(request, reply) {
          // set the logged in state (assume {email} was posted as JSON in request body)
          this.state('user', {
              email: request.payload.email
          });
          reply({success: true});
      })


.route('/api/customer/{id}')
    // GET method is assumed if not specified as well as a default "variant"

      // configuration values can be updated in the admin page as opposed to option values (see above) which can not
      .config({
          isAdmin: {
              label: 'is administrator?',
              // types are 'boolean', 'text', 'select', 'multiselect'
              type: 'boolean',
              defaultValue: true
          }
      })
      .onRequest(function(request, reply) {
          var customer = CUSTOMERS[request.params.id];
          if (customer) {
              // this is how we refer to "config" values
              customer.isAdmin = !!this.config('isAdmin');
              reply(customer);
          } else {
              reply(request.params.id + ' not found').code(404);
          }
      })

    // you can optionally add multiple variations of the response that can be selected through the admin panel
    .variant('500')
      .onRequest(function(request, reply) {
          reply({ message: 'Something bad happened' }).code(500);
      })


  // support customer updates (we're still referring to the "/api/customer/{id}" route)
  .method('PUT')
      .onRequest(function(request, reply) {
        // you would normally support some kind of validation
        var customer = CUSTOMERS[request.params.id];
        var payload = request.payload;
        customer.firstName = request.payload.firstName;
        customer.lastName = request.payload.lastName;
        reply({success: true});
      })


// plugins are like request handlers but they have a "next" callback to continue execution of the later plugins.  A plugin can also reply and not call next if it chooses to intercept the request
.plugin({
  onRequest: function(request, reply, next) {
    // this is how we refer to "option" values
    if (this.option('requiresLogin') !== false) {
        // make sure they are logged in
        if (!this.state('user')) {
            return reply({ error: 'AUTH_REQUIRED' }).code(401);
        }
    }
    next();
  }
})

.start({
    host: 'localhost',
    port: 8000
});
