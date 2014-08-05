var f = require('util').format;

var restartAndDone = function(configuration, test) {
  configuration.manager.restart(function() {
    test.done();
  });
}

exports['Should throw error due to mongos connection usage'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Mongos = configuration.require.Mongos
      , Db = configuration.require.Db;

    try {
      var replSet = new ReplSet([
          new Server('localhost', 28390),
          new Server('localhost', 28391),
          new Mongos([new Server('localhost', 28392)])
        ]
      , {rs_name:configuration.replicasetName}
      );
    } catch(err) {
      test.done();
    }
  }
}

exports['Should correctly handle error when no server up in replicaset'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server('localhost', 28390),
        new Server('localhost', 28391),
        new Server('localhost', 28392)
      ]
      , {rs_name:configuration.replicasetName}
    );

    var db = new Db('integration_test_', replSet, {w:0});
    db.open(function(err, p_db) {
      test.ok(err != null);

      db.close();
      test.done();
    });
  }
}

/**
 * Simple replicaset connection setup, requires a running replicaset on the correct ports
 *
 * @_class db
 * @_function open
 */
exports['Should correctly connect with default replicasetNoOption'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ]
      , {rs_name:configuration.replicasetName}
    );

    // DOC_LINE var replSet = new ReplSetServers([
    // DOC_LINE   new Server('localhost', 30000),
    // DOC_LINE   new Server('localhost', 30001),
    // DOC_LINE   new Server('localhost', 30002)
    // DOC_LINE ]);
    // DOC_START
    var db = new Db('integration_test_', replSet, {w:0});
    db.open(function(err, p_db) {
      test.equal(null, err);
      p_db.close();
      test.done();
    });
    // DOC_END
  }
}

exports['Should correctly connect with default replicaset'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replset start port
    configuration.manager.shutdown('secondary', {signal:15}, function() {
      // Replica configuration
      var replSet = new ReplSet([
          new Server(configuration.host, configuration.port),
          new Server(configuration.host, configuration.port + 1),
          new Server(configuration.host, configuration.port + 2)
        ]
        , {rs_name:configuration.replicasetName}
      );

      var db = new Db('integration_test_', replSet, {w:0});
      db.open(function(err, p_db) {
        test.equal(null, err);
        p_db.close();
        restartAndDone(configuration, test);
      })
    });
  }
}

exports['Should correctly connect with default replicaset and socket options set'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {socketOptions: {keepAlive:100}, rs_name:configuration.replicasetName}
    );

    var db = new Db('integration_test_', replSet, {w:0});
    db.open(function(err, p_db) {
      test.equal(null, err);
      // Get a connection
      var connection = db.serverConfig.connections()[0];
      test.equal(100, connection.keepAliveInitialDelay);
      p_db.close();
      test.done();
    })
  }
}

exports['Should emit close no callback'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    new Db('integration_test_', replSet, {w:0}).open(function(err, db) {
      test.equal(null, err);
      var dbCloseCount = 0, serverCloseCount = 0;
      db.on('close', function() { ++dbCloseCount; });

      // Force a close on a socket
      db.close();

      setTimeout(function() {
        test.equal(dbCloseCount, 1);
        test.done();
      }, 2000);
    })
  }
}

exports['Should emit close with callback'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    new Db('integration_test_', replSet, {w:0}).open(function(err, db) {
      test.equal(null, err);
      var dbCloseCount = 0;
      db.on('close', function() { 
        ++dbCloseCount; 
      });

      db.close(function() {
        // Let all events fire.
        process.nextTick(function() {
          test.equal(dbCloseCount, 1);
          test.done();
        });
      });
    })
  }
}

exports['Should correctly pass error when wrong replicaSet'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName + "-wrong"}
    );

    var db = new Db('integration_test_', replSet, {w:0});
    db.open(function(err, p_db) {
      test.notEqual(null, err);
      test.done();
    })
  }
}

var retries = 120;

var ensureConnection = function(configuration, numberOfTries, callback) {
  var ReplSet = configuration.require.ReplSet
    , Server = configuration.require.Server
    , Db = configuration.require.Db;

  // Replica configuration
  var replSet = new ReplSet([
      new Server(configuration.host, configuration.port),
      new Server(configuration.host, configuration.port + 1),
      new Server(configuration.host, configuration.port + 2)
    ], 
    {rs_name:configuration.replicasetName}
  );

  if(numberOfTries <= 0) return callback(new Error("could not connect correctly"), null);
  // Open the db
  var db = new Db('integration_test_', replSet, {w:0});
  db.open(function(err, p_db) {
    // Close the connection
    db.close();

    if(err != null) {
      // Wait for a sec and retry
      setTimeout(function() {
        numberOfTries = numberOfTries - 1;
        ensureConnection(configuration, numberOfTries, callback);
      }, 3000);
    } else {
      return callback(null);
    }
  })
}

exports['Should connect with primary stepped down'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    // Step down primary server
    configuration.manager.stepDown({force:true}, function(err, result) {
      // Wait for new primary to pop up
      ensureConnection(configuration, retries, function(err, p_db) {
        new Db('integration_test_', replSet, {w:0}).open(function(err, p_db) {
          test.ok(err == null);
          // Get a connection
          var connection = p_db.serverConfig.connections()[0];
          test.equal(true, connection.isConnected());
          // Close the database
          p_db.close();
          test.done();
        })
      });
    });
  }
}

exports['Should connect with third node killed'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Kill specific node
    configuration.manager.shutdown('secondary', {signal: -15}, function(err, node) {
      // Replica configuration
      var replSet = new ReplSet([
          new Server(configuration.host, configuration.port),
          new Server(configuration.host, configuration.port + 1),
          new Server(configuration.host, configuration.port + 2)
        ], 
        {rs_name:configuration.replicasetName}
      );

      // Wait for new primary to pop up
      ensureConnection(configuration, retries, function(err, p_db) {
        
        new Db('integration_test_', replSet, {w:0}).open(function(err, p_db) {
          test.ok(err == null);
          // Get a connection
          var connection = p_db.serverConfig.connections()[0];
          test.equal(true, connection.isConnected());
          // Close the database
          p_db.close();
          restartAndDone(configuration, test);
        })
      });
    });
  }
}

exports['Should connect with primary node killed'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Kill specific node
    configuration.manager.shutdown('primary', {signal: -15}, function(err, node) {
      // Replica configuration
      var replSet = new ReplSet([
          new Server(configuration.host, configuration.port),
          new Server(configuration.host, configuration.port + 1),
          new Server(configuration.host, configuration.port + 2)
        ], 
        {rs_name:configuration.replicasetName}
      );

      // Wait for new primary to pop up
      ensureConnection(configuration, retries, function(err, p_db) {      
        new Db('integration_test_', replSet, {w:0}).open(function(err, p_db) {
          test.ok(err == null);
          // Get a connection
          var connection = p_db.serverConfig.connections()[0];
          test.equal(true, connection.isConnected());
          // Close the database
          p_db.close();
          restartAndDone(configuration, test);
        })
      });
    });
  }
}

exports['Should correctly emit open signal and full set signal'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    var openCalled = false;
    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    var db = new Db('integration_test_', replSet, {w:0});
    db.once("open", function(_err, _db) {
      openCalled = true;
    });

    db.once("fullsetup", function(_err, _db) {
      test.equal(true, openCalled);

      // Close and cleanup
      _db.close();
      test.done();
    });

    db.open(function(err, p_db) {})
  }
}

exports['ReplSet honors socketOptions options'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {socketOptions: {
          connectTimeoutMS:1000
        , socketTimeoutMS: 3000
        , noDelay: false
      }, rs_name:configuration.replicasetName}
    );

    var db = new Db('integration_test_', replSet, {w:0});
    db.open(function(err, p_db) {
      test.equal(null, err);
      // Get a connection
      var connection = db.serverConfig.connections()[0];
      test.equal(1000, connection.connectionTimeout);
      test.equal(3000, connection.socketTimeout);
      test.equal(false, connection.noDelay);
      p_db.close();
      test.done();
    });
  }
}

exports['Should correctly emit all signals even if not yet connected'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    var db_conn = new Db('integration_test_', replSet, {w:1});
    var db2 = db_conn.db('integration_test_2');
    var close_count = 0;
    var open_count = 0;
    var fullsetup_count = 0;

    db2.on('close', function() {
      close_count = close_count + 1;
    });                                                                             
    
    db_conn.on('close', function() {
      close_count = close_count + 1;
    });                                                                             

    db2.on('open', function(err, db) {
      test.equal('integration_test_2', db.databaseName);
      open_count = open_count + 1;
    }); 

    db_conn.on('open', function(err, db) {
      test.equal('integration_test_', db.databaseName);
      open_count = open_count + 1;
    });

    db2.on('fullsetup', function(err, db) {
      test.equal('integration_test_2', db.databaseName);
      fullsetup_count = fullsetup_count + 1;
    });

    db_conn.on('fullsetup', function(err, db) {
      test.equal('integration_test_', db.databaseName);
      fullsetup_count = fullsetup_count + 1;
    });

    db_conn.open(function (err) {                                                   
      if(err) throw err;                                                           
                  
      // Wait for fullset
      var interval = setInterval(function() {
        if(fullsetup_count == 2) {
          clearInterval(interval);

          var col1 = db_conn.collection('test');                                        
          var col2 = db2.collection('test');                                            
                                                                                        
          var testData = { value : "something" };                                       
          col1.insert(testData, function (err) {                                        
            if (err) throw err;                                                         

            var testData = { value : "something" };                                       
            col2.insert(testData, function (err) {                                      
              if (err) throw err;                                                       
              db2.close(function() {
                setTimeout(function() {
                  test.equal(2, close_count);
                  test.equal(2, open_count);
                  test.done();
                }, 1000);
              });                                                                      
            });                                                                         
          });                                                                           
        }
      }, 200);
    });               
  }
}

exports['Should receive all events for primary and secondary leaving'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    // Counters to track emitting of events
    var numberOfJoins = 0;
    var numberLeaving = 0;

    // Add some listeners
    replSet.on("left", function(_server_type, _server) {
      numberLeaving += 1;
    });

    replSet.on("joined", function(_server_type, _doc, _server) {
      numberOfJoins += 1;
    });

    // Connect to the replicaset
    var db = new Db('integration_test_', replSet, {w:0});
    db.open(function(err, p_db) {
      // Kill the secondary
      configuration.manager.shutdown('secondary', {signal:-15}, function() {
        test.equal(null, err);
        p_db.close();
        restartAndDone(configuration, test);
      });
    });
  }
}

exports['Should Fail due to bufferMaxEntries = 0 not causing any buffering'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;

    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    // Counters to track emitting of events
    var numberOfJoins = 0;
    var numberLeaving = 0;

    // Connect to the replicaset
    var db = new Db('integration_test_', replSet, {w:1, bufferMaxEntries: 0});
    db.open(function(err, p_db) {

      // Setup
      db.serverConfig.on('left', function(t) {
        if(t == 'primary') {
          // Attempt an insert
          db.collection('_should_fail_due_to_bufferMaxEntries_0').insert({a:1}, function(err, ids) {
            test.ok(err != null);
            test.ok(err.message.indexOf("0") != -1)
            db.close();
            restartAndDone(configuration, test);
          });        
        }
      });

      // Kill the secondary
      configuration.manager.shutdown('primary', {signal: -15}, function() {
        test.equal(null, err);
      });
    });
  }
}

exports['Should correctly receive ping and ha events'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var ReplSet = configuration.require.ReplSet
      , Server = configuration.require.Server
      , Db = configuration.require.Db;
    
    // Replica configuration
    var replSet = new ReplSet([
        new Server(configuration.host, configuration.port),
        new Server(configuration.host, configuration.port + 1),
        new Server(configuration.host, configuration.port + 2)
      ], 
      {rs_name:configuration.replicasetName}
    );

    // Open the db connection
    new Db('integration_test_', replSet, {w:1}).open(function(err, db) {
      test.equal(null, err)
      var ha_connect = false;
      var ha_ismaster = false;
      var ping = false;

      // Listen to the ha and ping events
      db.serverConfig.once("ha_connect", function(err) {
        ha_connect = true;
      });

      db.serverConfig.once("ha_ismaster", function(err, result) {
        ha_ismaster = true;
      });

      db.serverConfig.once("ping", function(err, r) {
        ping = true;
      });

      var interval = setInterval(function() {
        if(ping && ha_connect && ha_ismaster) {
          clearInterval(interval);
          db.close();
          test.done();
        }
      }, 100);
    });
  }
}

exports['Should correctly connect to arbiter with single connection'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var mongo = configuration.require
      , ReplSet = mongo.ReplSet
      , Server = mongo.Server
      , Db = mongo.Db;

    // Replset start port
    var replicasetManager = configuration.manager;
    // Get the arbiters
    var arbiters = replicasetManager.arbiters;
    var host = arbiters[0].split(":")[0];
    var port = parseInt(arbiters[0].split(":")[1], 10);
    var db = new Db('integration_test_', new Server(host, port), {w:1});

    db.open(function(err, p_db) {
      test.equal(null, err);

      p_db.command({ismaster: true}, function(err, result) {
        test.equal(null, err);

        p_db.close();
        test.done();
      });
    })
  }
}

/**
 * @ignore
 */
exports['Should correctly connect to a replicaset with additional options'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var mongo = configuration.require
      MongoClient = mongo.MongoClient;

    var url = f("mongodb://localhost:%s,localhost:%s,localhost:%s/integration_test_?replicaSet=%s"
      , configuration.port, configuration.port + 1, configuration.port + 2, configuration.replicasetName)

    MongoClient.connect(url, {
      replSet: {
        haInterval: 500,
        socketOptions: {
          connectTimeoutMS: 500
        }
      }
    }, function(err, db) {
      test.equal(null, err);
      test.ok(db != null);

      test.equal(500, db.serverConfig.connections()[0].connectionTimeout);
      test.equal(0, db.serverConfig.connections()[0].socketTimeout);

      db.collection("replicaset_mongo_client_collection").update({a:1}, {b:1}, {upsert:true}, function(err, result) {
        test.equal(null, err);
        test.equal(1, result);

        db.close();
        test.done();
      });
    });
  }
}

/**
 * @ignore
 */
exports['Should correctly connect to a replicaset with readPreference set'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var mongo = configuration.require
      MongoClient = mongo.MongoClient;

    // Create url
    var url = f("mongodb://%s,%s/%s?replicaSet=%s&readPreference=%s"
      , f("%s:%s", configuration.host, configuration.port)
      , f("%s:%s", configuration.host, configuration.port + 1)
      , "integration_test_"
      , configuration.replicasetName
      , "primary");

    MongoClient.connect(url, function(err, db) {
      db.collection("test_collection").insert({a:1}, function(err, result) {
        test.equal(null, err);

        db.close();
        test.done();
      });
    });
  }
}

/**
 * @ignore
 */
exports['Should give an error for non-existing servers'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var mongo = configuration.require
      MongoClient = mongo.MongoClient;

    var url = f("mongodb://%s,%s/%s?replicaSet=%s&readPreference=%s"
      , "nolocalhost:30000"
      , "nolocalhost:30001"
      , "integration_test_"
      , configuration.replicasetName
      , "primary");

    MongoClient.connect(url, function(err, db) {
      test.ok(err != null);
      test.done();
    });
  }
}

/**
 * @ignore
 */
exports['Should correctly connect to a replicaset with writeConcern specified and GridStore should inherit correctly'] = {
  metadata: { requires: { topology: 'replicaset' } },
  
  // The actual test we wish to run
  test: function(configuration, test) {
    var mongo = configuration.require
      , MongoClient = mongo.MongoClient
      , GridStore = mongo.GridStore
      , ObjectID = mongo.ObjectID;

    // Create url
    var url = f("mongodb://%s,%s/%s?replicaSet=%s&w=%s&wtimeoutMS=5000"
      , f("%s:%s", configuration.host, configuration.port)
      , f("%s:%s", configuration.host, configuration.port + 1)
      , "integration_test_"
      , configuration.replicasetName
      , "majority");

    MongoClient.connect(url, function(err, db) {
      var gs = new GridStore(db, new ObjectID());
      test.equal('majority', gs.writeConcern.w);
      test.equal(5000, gs.writeConcern.wtimeout);
      db.close();
      test.done();
    });
  }
}