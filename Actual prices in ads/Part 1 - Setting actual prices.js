var CAMP_LABEL_NAMES = ["'Price Update'"]; //Массив с ярлыками кампаний, в которых проводить подстановку
var CHECKED_LABEL_NAME = "PriceChecked";//Ярлык уже проверенных объявлений
var SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1c-hr3azQIwH8OzT06DthfJnuGirRRx0fmID9VRYmlkk/edit"; //ссылка на фид

function main() {
  var spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var sheet = spreadsheet.getSheets()[0];
  var sheetData = sheet.getDataRange().getValues();
  var data = {};
  fillData(sheetData, data);

  var campaignIterator = AdWordsApp.campaigns()
                                   .withCondition("LabelNames CONTAINS_ANY [" +
                                                  CAMP_LABEL_NAMES.join(',') + "]")
                                   .get();
  while (campaignIterator.hasNext()) {
    var campaign = campaignIterator.next();

    var adGroupIterator = campaign.adGroups().withCondition("Status = ENABLED").get();
    while(adGroupIterator.hasNext()) {
      var adGroup = adGroupIterator.next();

      var adIterator = adGroup.ads().withCondition("LabelNames CONTAINS_NONE ['" +
                                                    CHECKED_LABEL_NAME + "']")
                              .get();
      while(adIterator.hasNext()) {
        var ad = adIterator.next();
        ad.applyLabel(CHECKED_LABEL_NAME);

        var url = ad.urls().getFinalUrl();

        if (url === null) continue;

        var stats = data[url];
        if (stats === undefined) continue;

        var price = stats[0];
        var available = stats[1];
        var adEnabled = ad.isEnabled();

        setCorrectAvailability((available === "true"), adEnabled, ad, adGroup);

        if (!adEnabled) {
          continue;
        }

        setAdPrice(adGroup, price);
      }
    }
  }
}

function fillData(sheetData, data) {
  for (var i = 0; i < sheetData.length; i++) {
    data[sheetData[i][1]] = [sheetData[i][4], sheetData[i][7]];
  }
}

function setCorrectAvailability(available, enabled, ad, adGroup) {
  if (available === enabled) {
    return;
  }

  if (available) {
    ad.enable();
    Logger.log(adGroup.getName() + " is enabled.");
  } else {
    ad.pause();
    Logger.log(adGroup.getName() + " is paused.");
  }
}

function setAdPrice(adGroup, price) {
  var keywordIterator = adGroup.keywords().get();

  while(keywordIterator.hasNext()) {
    var keyword = keywordIterator.next();
    setKeywordPrice(keyword, price);
  }
}

function setKeywordPrice(keyword, price) {
  keyword.setAdParam(1, price);
  Logger.log("Keyword: " + keyword.getText() + ", Price: " + price);
}
