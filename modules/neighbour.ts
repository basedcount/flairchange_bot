//The newly added 'Chad' flairs are willingly not present. Changes from chad to regular flairs will always be posted
const quadrant = {
    AuthRight: ['AuthCenter', 'Right'],
    Right: ['AuthRight', 'LibRight', 'Purple LibRight'],
    LibRight: ['Right', 'LibCenter', 'Purple LibRight'],
    "Purple LibRight": ['Right', 'LibCenter', 'LibRight'],
    LibCenter: ['Purple LibRight', 'LibRight', 'LibLeft'],
    LibLeft: ['LibCenter', 'Left'],
    Left: ['LibLeft', 'AuthLeft'],
    AuthLeft: ['Left', 'AuthCenter'],
    AuthCenter: ['AuthLeft', 'AuthRight'],
    Centrist: ['Grey Centrist'],
    "Grey Centrist": ['Centrist']
}

export default quadrant