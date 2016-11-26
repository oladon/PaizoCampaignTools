var db;

function createObjectStores(stores) {
//    console.log("Creating object stores: " + stores);
    var dbName = "pctLogs";
    var request = indexedDB.open(dbName);
    request.onsuccess = function (e){
        var database = e.target.result;
        var version =  parseInt(database.version);
        database.close();
        var secondRequest = indexedDB.open(dbName, version+1);
        secondRequest.onupgradeneeded = function (e) {
            var database = e.target.result;
            stores.forEach(function (name) { 
                if (!database.objectStoreNames.contains(name)) {
                    var objectStore = database.createObjectStore(name, { autoIncrement: true });
                    objectStore.createIndex("id", ["time", "from"], { unique: true });
                }
            });
        };
        secondRequest.onsuccess = function (e) {
            e.target.result.close();
        };
    };
}

// Connect to the database
function DBConnect(campaigns, callback) {
    //    console.log("Connecting...");
    var DBOpenRequest = window.indexedDB.open("pctLogs");
    
    DBOpenRequest.onerror = function(event) {
        console.log("Error loading database.");
    };
    
    DBOpenRequest.onsuccess = function(event) {
        //        console.log("Connected!");
        db = event.target.result;
        var thisDB = db;
        db.onversionchange = function(e){
            console.log("Version change triggered, so closing database connection", e.oldVersion, e.newVersion, thisDB);
            thisDB.close();
        };
        
/*        db.onerror = function(e) {
            console.log("An error occurred!");
        };*/
        
        campaigns && campaigns.forEach(function (campaign) {
            if (!db.objectStoreNames.contains(campaign)) {
                createObjectStores(campaigns);
                return false;
            }
        });
        
        callback();
    };
}

// Retrieve x records for a room from the database
function retrieveRecords(store, n, callback) {
    //    console.log("Retrieving " + n + " records from store " + store);
    var i = 0;
    var results = [];

    if (!db) {
        DBConnect(null, function() { retrieveRecords(store, n, callback); });
    } else if (!db.objectStoreNames.contains(store)) {
        callback(null);
    } else {
        var transaction = db.transaction([store]);
        var objectStore = transaction.objectStore(store);
        
        objectStore.openCursor(null, "prev").onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor && i < n) {
                results.unshift(cursor.value);
                i++;
                cursor.continue();
            } else {
                callback(results);
            }
            
        };
    }
}

// Add a record to the database (no duplicates)
function addRecord(store, record, callback) {
    if (!db || !db.objectStoreNames.contains(store)) {
        DBConnect([store], function() { addRecord(store, record, callback); });
    } else {
        var transaction = db.transaction([store], "readwrite");
        var objectStore = transaction.objectStore(store);
        
        transaction.onerror = function (e) { 
            if (e.target.error.name == "ConstraintError") { e.stopPropagation(); } };
        objectStore.add(record);
        callback && callback();
    }
}
