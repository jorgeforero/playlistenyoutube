/**
 * One Year of Songs YouTube Playlist
 * Creación y mantenimiento de Playlists de YouTube con Apps Script 
 */

/*
Parte de la respuesta del YouTube API 
"items": [
  {
   "kind": "youtube#playlistItem",
   "etag": "\"DuHzAJ-eQIiCIp7p4ldoVcVAOeY/Ktqi5NIapmys1w2V0FiorhFR-Uk\"",
   "id": "UExES3pRck8tTUFDZndHV3Z0eXVaVHZXNENxNTNGYV9wNC4wMTcyMDhGQUE4NTIzM0Y5",
   "snippet": {
    "publishedAt": "2018-06-06T13:43:17.000Z",
    "channelId": "xxxxxxxxxxxxxxxxxx",
    "title": "Deleted video",
    "description": "This video is unavailable.",
    "channelTitle": "xxxxxxxxxxxxxxxxxx",
    "playlistId": "xxxxxxxxxxxxxxxxxxxxxxx",
    "position": 0,
    "resourceId": {
     "kind": "youtube#video",
     "videoId": "D6NOeUfxCnM"
    },
    ..
    ..
  ]

 Ver list en la referencia del YouTube API:
 https://developers.google.com/youtube/v3/docs/playlistItems/list?apix_params=%7B%22part%22%3A%5B%22snippet%22%5D%2C%22maxResults%22%3A50%2C%22pageToken%22%3A%22EAAajQFQVDpDQW9pRUVRd1FUQkZSamt6UkVORk5UYzBNa0lvQVVpUy1KUFk2Y1NHQTFBQldrUWlRMmxLVVZSRVVrSmlWVEZZVjBSb2RHSkhiRWxaTTFKYVVqQlZlRlZFUWt4Wk1Wa3lZVEl4U1dNeFVsWmFiRkpoUldkelNXNUtWME56ZDFsUk1FcDVSMUZuSWc%22%2C%22playlistId%22%3A%22PL4AmMWX8mliHctYGE1P0KcV6kmHsTUfTZ%22%7D#ruby
*/

// Tamaño de la página
const MAXRESULTS = 50;
const PLAYLISTID = 'PL4AmMWX8mliHctYGE1P0KcV6kmHsTUfTZ';
const FLAG = 'Added';

/**
 * addSetVideosToPlaylist
 * A partir de los datos de los videos registrados en la hoja de cálculo, se adicionan
 * los videos a la playlist dada.  Esta función tiene un limite de carga de información
 * de acuerdo a las restricciones dadas por el API.  Para hacer la carga es necesario
 * ejecutarla varias veces.  La función va registrando en la hoja los videos que ya han sido
 * cargados
 * 
 * @param {void} - void
 * @return {void} - Videos asociados a la playlist
 */
function addSetVideosToPlaylist() {
  // Hoja de cálculo con la información de los videos
  let book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName( 'First Year' );
  let data = sheet.getDataRange().getValues();
  // Contador de los registros cargados
  let uploadercounter = 0;
  // Encabezado de los datos
  let header = data.shift();
  // Recorre los datos y va adicionando el video a la playlist si el status en vacio
  for ( let indx=0; indx<data.length; indx++ ) {
    if ( uploadercounter == MAXRESULTS ) break;
    let record = getRowAsObject( data[ indx ], header );
    // Adición a la lista, si el estado es diferente a adicionado FLAG
    if ( record.status != FLAG ) {
      addToPlaylist( record.videoid, record.year );
      data[ indx ][ getColumnIndex( header, 'Status' ) ] = FLAG;
      uploadercounter++;
    }
   }//for
  // Actualizacion de la hoja - los estados de los registros
  if ( uploadercounter != 0 ) sheet.getRange( 2, 1,  data.length, data[0].length ).setValues( data );
  console.log( `Videos cargados: ${uploadercounter}` );
};

/**
 * addToPlaylist
 * Permite adicionar un video a una playlist dada
 * Esta función fué desarrollada por Martin Hawksey
 * y tomada de https://gist.github.com/mhawksey/c2117b6d0e39a9f0fec4
 * 
 * @param {string} id - Id del video 
 * @param {string} desc - Descripción del video 
 * @param {number} startPos - Tiempo específico para inicio de reproducción
 * @param {number} endPost - Tiempo específico para fin de reproducción
 * @return {void} - Videos adicionados a la lista
 */
function addToPlaylist( id, desc, startPos, endPos ) {
  // El API requiere un objeto que tenga la información del recurso
  let details = {
    videoId: id,
    kind: 'youtube#video'
  }
  if ( startPos != undefined ) details[ 'startAt' ] = startPos;
  if ( endPos != undefined ) details[ 'endAt' ] = endPos;
  if ( desc == undefined ) var desc = "";
  // Determina el nivel de información a entregar al API
  let part= 'snippet,contentDetails';
  // Datos de la playlist
  let resource = {
    snippet: {
      playlistId: PLAYLISTID,
      resourceId: details
    },
    contentDetails:{
      note: desc
    }
  };
  let request = YouTube.PlaylistItems.insert(resource, part);
};

/**
 * getRowAsObject
 * Obtiene un objeto con los valores de la fila dada: RowData. Toma los nombres de las llaves del parámtero Header. Las llaves
 * son dadas en minusculas y los espacios reemplazados por _
 * 
 * @param {array} RowData - Arreglo con los datos de la fila de la hoja
 * @param {array} Header - Arreglo con los nombres del encabezado de la hoja
 * @return {object} obj - Objeto con los datos de la fila y las propiedades nombradas de acuerdo a Header
 */
 function getRowAsObject( RowData, Header ) {
  let obj = {};
  for ( let indx=0; indx<RowData.length; indx++ ) {
    obj[ Header[ indx ].toLowerCase().replace( /\s/g, '_' ) ] = RowData[ indx ];
  };//for
  return obj;
};

/**
 * getColumnIndex
 * Obtiene el indice (index-0) de la columna con el nombre Name
 * @param {string} Name - Nombre de la columna de acuerdo a el header
 * @return {integer} - Indice de Name en header o -1 sino lo encontró
 */
function getColumnIndex( Header, Name ) {
  return Header.indexOf( Name ); 
};

/**
 * getAllVideosPlayList
 * Obtiene un arreglo de objetos con la información de los videos que hacen parte del Playlist dado.
 * 
 * $param {string} PlayListId - Id de la Playlist
 * $return {array} videos - Arreglo de objetos { videoid, title, id } con la información de los videos
 */
function getAllVideosPlayList( PlayListId ) { 
  // El parámetro "part" especifica una lista separada por comas de una o más propiedades de recursos playlistItem que la respuesta de API incluirá
  let part = 'snippet,contentDetails'; 
  // Arreglo donde se obtienen los datos que retirna el API
  let items = [];
  // Arreglo donde quedan los datos filtrados: title y id para cada video
  let videos = [];
  // Acumuladores
  let nextPage = '', res;
  do {
    // Obtiene el listado paginado por MAXRESULTS, nextPage contiene el token a la siguiente página si la hay
    res  = YouTube.PlaylistItems.list( part, { playlistId: PlayListId, maxResults: MAXRESULTS, pageToken: nextPage } );
    // Determina si hay siguiente página
    if ( 'nextPageToken' in res ) nextPage = res.nextPageToken;
    // Va uniendo los resultados en el arreglo items
    items = items.concat( res.items );
  } while ( 'nextPageToken' in res );
  // Formatea las respuestas acumuladas en items para que contenga los datos relevantes
  items.map( video => {
    videos.push( { videoid: video.snippet.resourceId.videoId, title: video.snippet.title, id: video.id } );
  });
  return videos;
};

/**
 * AddtoSheet
 * Adiciona los datos obtenidos de los videos en la hoja de cálculo
 * 
 * @param {array} Videos - Arreglo con los datos de los videos 
 * @return {void} - Datos en la hoja de cálculo, si los hay 
 */
function AddtoSheet( Videos ) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName( 'List' );
  box = [];
  Videos.map( video => { box.push( [ [ video.videoid ], [ video.title ], [ video.id ] ] ); });
  sheet.getRange( 2, 1, box.length, box[ 0 ].length ).setValues( box );
};

/**
 * removeDeletedVideos
 * Remueve los videos de la Playlist identificados como borrado o cambiado a privado
 * @param {array} Videos - Arreglo con los datos de los videos
 * @return {number} videosRemoved - Número de videos removidos
 */
function removeDeletedVideos( Videos ) {
  // Identificador Video borrado o Privado
  let markerDeleted = 'Deleted video';
  let markerPrivate = 'Private video';
  let videosRemoved = 0;
  // Recorre el listado removiendo de la lista los videos que han sido borrados
  Videos.forEach( video => {
    if ( ( video.title == markerDeleted ) || ( video.title == markerPrivate ) ) {
      // Para remover el video de la playlist debe pasarsele el id del video y no el el id del recurso: videoId
      res = YouTube.PlaylistItems.remove( video.id );
      videosRemoved++;
    };
  });
  return videosRemoved;
};

/**
 * Test
 * Llamado de las funciones para test
 */
function Test() {
  let videos = getAllVideosPlayList( PLAYLISTID );
  console.log( videos );
  // AddtoSheet( videos );
  // let removed = removeDeletedVideos( videos );
  // console.log( `Videos removidos: ${removed}` );
};
