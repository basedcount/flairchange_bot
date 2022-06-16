//The newly added 'Chad' flairs are willingly not present. Changes from chad to regular flairs will always be posted
const quadrant = {
    AuthRight: ['AuthCenter', 'Right'],
    Right: ['AuthRight', 'LibRight', 'PurpleLibRight'],
    LibRight: ['Right', 'LibCenter'],
    PurpleLibRight: ['Right', 'LibCenter'],
    LibCenter: ['PurpleLibRight', 'LibRight', 'LibLeft'],
    LibLeft: ['LibCenter', 'Left'],
    Left: ['LibLeft', 'AuthLeft'],
    AuthLeft: ['Left', 'AuthCenter'],
    AuthCenter: ['AuthLeft', 'AuthRight'],
    Centrist: ['GreyCentrist'],
    GreyCentrist: ['Centrist']
}

module.exports = quadrant