function main() {
  //Здесь вставить URL гуглдока
  var dockURL = 'https://docs.google.com/spreadsheets/d/1D9vYHijIoCu0m-S9F6B3hAYRn-birG7jvZ4OpZyFeNw/edit#gid=0';
  var dateFrom = "20170101"; //Дата начала отчетного периода в формате ГГГГГММДД
  var dateTo = "20171231"; //Дата окончания отчетного периода в формате ГГГГГММДД
  var goalCPO = 300; //Целевая цена конверсии
  var ss = SpreadsheetApp.openByUrl(dockURL);
  var list = ss.getSheets()[0];

  //Рассчитываем Коэффициент амнистии для аккаунта
  var sumCA = 0;
  var sumClicks = 0;
  var ki = AdWordsApp.keywords()
                     .withCondition("CampaignStatus = ENABLED")
                     .withCondition("AdGroupStatus = ENABLED")
                     .withCondition("Status = ENABLED")
                     .forDateRange(dateFrom, dateTo)
                     .withCondition("Clicks > 0")
                     .get();

  while (ki.hasNext()) {
    var kw = ki.next();
    var kwStats = kw.getStatsFor(dateFrom, dateTo);
    sumClicks += kwStats.getClicks();
    sumCA += kw.bidding().getCpc() * kwStats.getClicks() / kwStats.getAverageCpc();
  }
  var avgAmnistyCoefficient = Math.round(sumCA * 100 / sumClicks) / 100;
  Logger.log(avgAmnistyCoefficient);

  //Занимаемся оформлением листа
  list.clear();

  list.getRange(1, 1, 1, 15)
      .setValues([ ['Кампания', 'Группа', 'Group ID', 'Ключ', 'ID', 'Клики', 'Конверсии', 'Средняя CPC', 'Наша ставка', 'Коэффициент амнистии' , 'СR прогноз' , 'CPO прогноз', 'CPO предельный', 'CPC_Целевой', 'CPC_Установить'] ])
      .setFontWeight('bold')
      .setBackground('#93C47D');
  list.getRange(1, 16).setValue('Коэффициент амнистии общий: ' + avgAmnistyCoefficient);

  var i = 2;

  var campaignIterator = AdWordsApp.campaigns().withCondition("Status = ENABLED").get();

  while (campaignIterator.hasNext()) {
    var campaign = campaignIterator.next();
    var campaignName = campaign.getName();
    var adGroupIterator = campaign.adGroups()
                                  .withCondition("Status = ENABLED")
                                  .forDateRange(dateFrom, dateTo)
                                  .orderBy("Clicks DESC")
                                  .get();

    while (adGroupIterator.hasNext()) {
      var adGroup = adGroupIterator.next();
      var adGroupName = adGroup.getName();
      var adGroupId = adGroup.getId();
      var adGroupCR = adGroup.getStatsFor(dateFrom, dateTo).getConversionRate();
      var keywordIterator = adGroup.keywords()
                                   .withCondition("Status = ENABLED")
                                   .withCondition("Clicks > 0")
                                   .forDateRange(dateFrom, dateTo)
                                   .orderBy("Clicks DESC").get();

      while (keywordIterator.hasNext()) {
        var keyword = keywordIterator.next();
        var stats = keyword.getStatsFor(dateFrom, dateTo);
        var keywordConversions = stats.getConversions();
        var keywordClicks = stats.getClicks();
        var keywordBid = keyword.bidding().getCpc();
        var keywordCPC = stats.getAverageCpc();
        var amnistyCoefficient = Math.round( keywordBid * 100 / keywordCPC ) / 100;
        var value = [[ campaignName,
                   adGroupName,
                   adGroupId,
                   keyword.getText(),
                   keyword.getId(),
                   keywordClicks,
                   keywordConversions,
                   Math.round(keywordCPC * 100) / 100,
                   keywordBid,
                   amnistyCoefficient ]];

        var keywordCR = ( keywordConversions + 1 ) / (keywordClicks + ( 1 / adGroupCR ) ) ;
        value[0].push( Math.round(keywordCR * 10000) / 100 );

        if (keywordCR == 0) {
          value[0].push(0, 0, 0, 0);
        } else {
          var keywordCPO = keywordCPC / keywordCR ;
          value[0].push( Math.round(keywordCPO * 100) / 100 );

          var keywordMaxCPO = keywordBid / keywordCR ;
          value[0].push( Math.round(keywordMaxCPO * 100) / 100 );

          var goalCPC = goalCPO * keywordCR;
          value[0].push( Math.round(goalCPC * 100) / 100 );

          var goalSetCPC = goalCPC * avgAmnistyCoefficient;
          value[0].push( Math.round(goalSetCPC * 100) / 100 );
        }

        list.getRange(i, 1, 1, 15).setValues(value);
        list.getRange(i, 6, 1, 15).setHorizontalAlignment('center');
        i++;

      }
    }
  }
}
