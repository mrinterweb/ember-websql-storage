var m;

function waitForDbInit() {
  waitsFor(function() { return App.dbCreated; }, 'DB initialization', 4000);
}

function waitsFor(fn, label, time) {
  QUnit.stop();
  var int2 = setInterval(function() {
    throw new Error(label + 'was not completed after ' + time + ' ms.');
  }, time);
  var int =  setInterval(function() {
    if (fn()) {
      clearInterval(int);
      clearInterval(int2);
      QUnit.start();
    }
  }, 50);
}

var db = store.adapterFor('test_model').db;

var wipeDB = function() {
  stop();
  db.transaction(function(tx) {
    tx.executeSql('delete from test_models where 1 = 1');
    start();
  });
};

var debugTestModelsTable = function(msg) {
  db.transaction(function(tx) {
    tx.executeSql('select * from test_models', [], function(_tx, res) {
      console.log(msg);
      console.log('number of rows found:', res.rows.length);
      for(i = 0; i < res.rows.length; i++) {
        console.log('row:', res.rows.item(i));
      }
    });
  });
};

createFactory = function() {
  m = store.createRecord('test_model', {
    string: 'String!',
    number: 1234,
    date: new Date(),
    boolean: true
  });
};
module('Create', {
  setup: function() {
    waitForDbInit();
    wipeDB();
    createFactory();
  }
});

asyncTest('creates a record', function() {
  debugTestModelsTable('before m.save()');
  m.save().then(function() {
    debugTestModelsTable();
    ok(m.get('number'), 1234);
    m.destroyRecord();
    start();
  }, function(err) {
    console.error(err, err.message);
    ok(false);
    start();
  });
});

module('Read, Update, Delete', {
  setup: function() {
    waitForDbInit();
    wipeDB();
    createFactory();
    m.save().then(function(val) {
      Ember.RSVP.resolve(val);
    }, function(err) {
      Ember.RSVP.resolve(err);
      throw(err);
      // ok(false);
    });
  },
  teardown: function() {
    if(jQuery.isEmptyObject(m._inFlightAttributes)) {
      m.on('didLoad', function() {
        m.destroyRecord();
      });
    } else {
      m.destroyRecord();
    }
  }
});

asyncTest('retrieves a record', function() {
  debugTestModelsTable('before findAll');
  var first = store.findAll('test_model')[0];
  var m2 = store.find('test_model', m.get('id'));
  m2.then(function() {
    start();
    ok(m2.get('string') == m.get('string'));
  }, function(err) {
    start();
    throw(err);
  });
});

asyncTest('updates a record', function() {
  m.set('number', 4567);
  m.save().then(function() {
    start();
    resolve(ok(m.get('number') === 4567));
  }, function(err) {
    start();
    throw(err);
    // Ember.RSVP.reject(err);
  });
});
