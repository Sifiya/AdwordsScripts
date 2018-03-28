/**************************************************
Remove duplicate keywords

Created By: Hrynko Tetiana
**************************************************/
/*
  Скрипт сначала находит все повторяющиеся ключевые слова в пределах
  одной каждой кампании, а затем сравнивает их и удаляет те, что
  с более низким показателем качества или (если он одинаковый) более высокой ставкой
*/

function main() {
  //Какую дату брать для сравнения
  //альтернативы LAST_7_DAYS или LAST_30_DAYS или LAST_14_DAYS или THIS_MONTH или ALL_TIME
  // Последнее скорей всего самое долгое
  var dateString = 'LAST_30_DAYS';

  var campaignIterator = AdWordsApp.campaigns()
                                   .withCondition("AdvertisingChannelType = SEARCH")
                                   .withCondition('Status = ENABLED')
                                   .get();
  var objKW = {}; //Сюда будут записываться данные о повторяющихся keywords в рамках одной кампании

  while (campaignIterator.hasNext()) {
    var campaign = campaignIterator.next();
    var campaignName = campaign.getName();
    objKW[campaignName] = {};

    //Перебираем ключевые слова
    var keywordIterator = campaign.keywords()
                                  .withCondition('AdGroupStatus = ENABLED')
                                  .withCondition('Status = ENABLED')
                                  .withCondition('KeywordMatchType = BROAD')
                                  .get();

    while (keywordIterator.hasNext()) {
      var keyword = keywordIterator.next();
      var kText = keyword.getText().split(" ").sort().join(" ");

      var keywordStats = keyword.getStatsFor(dateString);
      var keywordQS = keyword.getQualityScore() || 0;

      if (!(kText in objKW[campaignName])) objKW[campaignName][kText] = [];
      objKW[campaignName][kText].push( [keyword.getAdGroup().getId(),
                                        keyword.getId(),
                                        keywordQS,
                                        keywordStats.getAverageCpc(),
                                        keywordStats.getConversions()
                                     ] );
    }
  }

  cleanFromUnique(objKW);
  saveBestKW(objKW);

  function cleanFromUnique(obj) {
    for (var campaign in obj) {
      for (var keyword in obj[campaign]) {
        if (obj[campaign][keyword].length === 1) {
          delete obj[campaign][keyword];
          continue;
        }
      }
    }
  }

  function saveBestKW(obj) {
    for (var campaign in obj) {
      for (var keyword in obj[campaign]) {
        obj[campaign][keyword].sort(function(a,b) {
                                                   if (a[4] > b[4]) return -1;
                                                   if (a[4] < b[4]) return 1;
                                                   if (a[4] === b[4]) {
                                                     if (a[2] > b[2]) return -1;
                                                     if (a[2] < b[2]) return 1;
                                                     if (a[2] === b[2]) {
                                                       if (a[3] > b[3] && b[3] > 0) return 1;
                                                       return -1;
                                                     }
                                                   }
                                                   });

        for (var i = 1; i < obj[campaign][keyword].length; i++) {
         var keywordIterator = AdWordsApp.keywords().withIds([ [ obj[campaign][keyword][i][0],  obj[campaign][keyword][i][1]] ]).get();
         var oneKeyword = keywordIterator.next();
         Logger.log('Left: conv ' + obj[campaign][keyword][0][4]
                     + ", QS " + obj[campaign][keyword][0][2]
                     + ", CPC " + obj[campaign][keyword][0][3]
                     + ' Removed: ' + oneKeyword.getText()
                     + ", conv " + obj[campaign][keyword][i][4]
                     + ", QS " + obj[campaign][keyword][i][2]
                     + ", CPC " + obj[campaign][keyword][i][3]);

         oneKeyword.remove();
        }
      }
    }
  }

}
