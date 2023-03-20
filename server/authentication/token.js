
//-------- authentication --------------------------------------------------------------------------------------------------------------*/

const jwt = require('jsonwebtoken');

// the token verification
exports.verifyToken = (req, res, next) => {
    try{
        let result = decodeToken(req);
        if(result.success) {
            next();
        } else {
            res.status(403).json(result);
        }
    }
    catch (e) {
        if(!(e.name in ERROR_LIB)) {
            e = new ERROR_LIB.SRV_ERROR(`An error in a verifyToken function!`, e.message);
        }
        ERROR_LIB.emitter.emit('Error', e);
        res.status(500).send('#500. Internal server error!');
    }
};

// get a new couple of tokens using refreshToken
exports.updateTokens = async (req, res) => {
    try{
        let result = decodeToken(req);
        if(!result.success) res.status(403).json(result)
        else {
            const dbRequest = require(PROJECT.ROOT + '/authentication/db_request.js');
            const credentialsFromDB = FUNCTIONS.dbResponseToCamelCase(await dbRequest.getCredentialsFromDB(req));
            if(credentialsFromDB?.refreshToken){
                if(req.fullToken === credentialsFromDB.refreshToken){
                    let newTokens = this.getNewTokens(credentialsFromDB);
                    await dbRequest.saveTokenToDB(credentialsFromDB, newTokens.refreshToken);
                    res.status(200).send({
                        success: true,
                        message: 'tokens were updated successful!',
                        ...newTokens
                    });
                }
                else {
                    res.status(403).send({
                        success: false,
                        message: 'Incorrect refreshToken'
                    });
                }
            }
            else {
                res.status(403).send({
                    success: false,
                    message: 'bad request. the user was not found!'
                });
            }
        }
    }
    catch (e) {
        if(!(e.name in ERROR_LIB)) {
            e = new ERROR_LIB.SRV_ERROR(`An error occurred while updating tokens!`, e.message);
        }
        ERROR_LIB.emitter.emit('Error', e);
        res.status(500).send('#500. Internal server error!');
    }
};

// get a new couple of tokens
exports.getNewTokens = (args) => {
    try{
        let {id, login} = args;
        let token = jwt.sign(
            {
                id: id,
                login: login,
            },
            PROJECT.SECRET,
            {
                expiresIn: 600
            }
        );
        let refreshToken = jwt.sign(
            {
                id: id,
                login: login,
            },
            PROJECT.SECRET,
            {
                expiresIn: '24h'
            }
        );
        return {token, refreshToken}
    }
    catch (e) {
        if(!(e.name in ERROR_LIB)) {
            e = new ERROR_LIB.SRV_ERROR(`An error occurred while receiving a new token!`, e.message);
        }
        throw e;
    }
};

// decodes the token and attaches it to the request
const decodeToken = (req) => {
    try{
        let token = req.headers['authorization'];
        if(token?.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }
        if(token) {
            return jwt.verify(token, PROJECT.SECRET, (err, decoded) => {
                        if (err) {
                            return { success: false, message: 'Token is not valid' };
                        } else {
                            req.decoded = decoded;
                            req.fullToken = token;
                            return { success: true };
                        }
                    });
        } else {
            return { success: false, message: 'Auth token is not supplied' };
        }
    }
    catch (e) {
        if(!(e.name in ERROR_LIB)) {
            e = new ERROR_LIB.SRV_ERROR(`An error occurred while decoding the token!`, e.message);
        }
        throw e;
    }
};

