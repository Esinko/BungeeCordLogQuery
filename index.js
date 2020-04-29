/* Require */
const fs = require("fs")

/* Constants */
const input = process.argv[2].toLocaleLowerCase() //The username or ip to query by.
const dataPath = "./data/" //The path to the log files.
const filenameDefault = "proxy.log" //The program will only read files which have this in the start of their filename.

/* Memory */
global.memory = {
    data: [],
    results: []
}

/* Functions */
/**
 * Get all the data from the logs.
 * @param {""} path 
 * @param {(error="")} callback The callback function.
 */
async function getGroups(callback){
    try {
        fs.readdir(dataPath, async (err, files) => {
            if(err != null){
                callback("Directory reader error: " + err)
            }else {
                if(files.length != 0){
                    let verify = files.length-1
                    let verifyCount = 0
                    let totalIndex = 0
                    let pushedIndex = 0
                    try {
                        let interval = setInterval(async () => {
                            if(verify == verifyCount){
                                process.stdout.moveCursor(parseInt("-" + process.stdout.columns), 0)
                                process.stdout.clearLine(1)
                                process.stdout.write("Reading: " + pushedIndex + "/" + totalIndex + " " + verifyCount + "/" + verify)
                                clearInterval(interval)
                                callback(null)
                            }else {
                                process.stdout.moveCursor(parseInt("-" + process.stdout.columns), 0)
                                process.stdout.clearLine(1)
                                process.stdout.write("Reading: " + pushedIndex + "/" + totalIndex + " " + verifyCount + "/" + verify)
                            }
                        }, 10)
                        files.forEach(async file => {
                            try {
                                fs.readFile(dataPath + file, async (err, data) => {
                                    if(err != null){
                                        callback("Reader error: " + err)
                                    }else {
                                        let array = data.toString().split("\n")
                                        let index = 0
                                        totalIndex = totalIndex + parseInt(data.length)
                                        array.forEach(async item => {
                                            ++index
                                            ++pushedIndex
                                            if(!item.includes(",/")){
                                                if(index == item.length){
                                                    ++verifyCount
                                                }
                                                return;
                                            }
                                            item = item.split("[")
                                            item = item[2]
                                            item = item.split(":")[0]
                                            item = item.split(",/")
                                            item = {
                                                name: item[0],
                                                ip: item[1]
                                            }
                                            global.memory.data.push(item)
                                            if(index == item.length){
                                                ++verifyCount
                                            }
                                        })
                                    }
                                })
                            }   
                            catch(err){
                                callback("Unexpected reader error: " + err)
                            }
                        })
                    }
                    catch(err){
                        callback("Read loop error: " + err)
                    }
                }else {
                    callback("Nothing to read in " + dataPath)
                }
            }
        })
    }
    catch(err){
        callback("Unexpected error: " + err)
    }
}
/**
 * Find all matches in the data read.
 * @param {(error="")} callback The callback function.
 */
async function getByInput(callback){
    try {
        let matches = {
            ip: [],
            name: []
        }
        let verify = global.memory.data.length
        let verifyCount = 0
        let index = 0
        global.memory.data.forEach(async player => {
            ++index
            if(player.ip == input && !matches.ip.includes(player.name)){
                matches.ip.push(player.name)
            }
            if(player.name.toLocaleLowerCase() == input && !matches.name.includes(player.ip)){
                matches.name.push(player.ip)
            }
            ++verifyCount
        })
        let interval = setInterval(async () => {
            if(verifyCount == verify){
                clearInterval(interval)
                global.memory.results = matches
                callback(null)
            }else {
                process.stdout.cursorTo(process.stdout.columns, process.stdout.rows)
                process.stdout.clearLine()
                process.stdout.push("Scanning: " + pushedIndex + "/" + totalIndex)
            }
        }, 10)
    }
    catch(err){
        callback("Unexpected finder error: " + err)
    }
}
/**
 * Verify the command arguments are valid.
 * @param {(err="")} callback The callback function.
 */
async function verifyArgs(callback){
    try {
        if(input != undefined){
            if(fs.existsSync(dataPath)){
                callback(null)
            }else {
                callback("Cannot find data path!")
            }
        }else {
            callback("Missing input argument! node [filename].js [input]<--- HERE")
        }
    }
    catch(err){
        callback("Unexpected argument verification error: " + err)
    }
}

/* Code */
console.log("Welcome to Esinko Bungeecord log user data reader!\n------------------------------")
try {
    console.log("\nStage 1.", "Verifying arguments...")
    verifyArgs(async (err) => {
        if(err != null){
            console.log("Invalid arguments:\n   " + err)
            process.exit()
        }else {
            console.log("Arguments valid!\n-", "\nStage 2.", "\nReading data...")
            getGroups(async (err) => {
                if(err != null){
                    console.log("Failed to read data:\n   " + err)
                    process.exit()
                }else {
                    console.log("\nReading complete!\n-", "\nStage 3.", "\nQuerying data...")
                    getByInput(async (err) => {
                        if(err != null){
                            console.log("Failed to query data:\n   " + err)
                            process.exit()
                        }else {
                            console.log("\nQuery complete!\n-\nProcess complete!", "\n------------------------------")
                            console.log("Found " + global.memory.results.ip.length + " IP matches:\n   ", global.memory.results.ip.join(", "))
                            console.log("Found " + global.memory.results.name.length + " username matches:\n   ", global.memory.results.name.join(", "))
                        }
                    })
                }
            })
        }
    })
}
catch(err){
    console.log("Unexpected code error: " + err)
    process.exit()
}
