function getURLParam(key, defaultValue, integer) {
    var regex = new RegExp('[?|&]' + key + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search);
    var value = decodeURIComponent((regex || [,''])[1].replace(/\+/g, '%20')) || null;

    if(!value) {
        return defaultValue;
    }

    if(integer === true) {
        if(isNaN(value)) {
            return defaultValue;
        }
        return parseInt(value);
    }

    return value;
}