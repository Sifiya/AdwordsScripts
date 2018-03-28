function main () {
  //Здесь вставить URL гуглдока
  var dockURL = 'https://docs.google.com/spreadsheets/d/1D9vYHijIoCu0m-S9F6B3hAYRn-birG7jvZ4OpZyFeNw/edit#gid=0';
  var goalCPO = 300; //Целевая цена конверсии
  var maxCPC = 5; //Максимально приемлемая для нас ставка
  var ss = SpreadsheetApp.openByUrl(dockURL);
  var list = ss.getSheets()[0];


  for (var i = 2; i < list.getLastRow(); i++) {

    var ki = AdWordsApp.keywords().withIds([ [ list.getRange(i, 3).getDisplayValue(), list.getRange(i, 5).getDisplayValue()] ]).get();
    var keyword = ki.next();

    //Получаем данные из таблицы и приводим их в божеский вид для обработки
    var predictiveCPO = +( list.getRange(i, 12).getDisplayValue().replace(",", ".") );
    var maxCPO = +( list.getRange(i, 13).getDisplayValue().replace(",", ".") );
    var establishCPC = +( list.getRange(i, 15).getDisplayValue().replace(",", ".") );
    var clicks = +list.getRange(i, 6).getDisplayValue();
    var conversions = +list.getRange(i, 7).getDisplayValue();

    //Останавливаем все ключевые фразы, которым рекомендовано ставку 0, 50 кликов и нет конверсий
    if (maxCPO === 0 && clicks >= 50 && conversions === 0) {
      keyword.pause();
    }

    //Устанавливаем целевую ставку если прогнозное CPO больше, чем нужное нам целевое
    if (predictiveCPO > goalCPO) {
      keyword.bidding().setCpc(establishCPC);
    }

    //Поднимаем ставку, если максимальное CPO меньше целевого (Таким образом поднимаем выше в аукционе самые рентабельные ключевые фразы)
    if (maxCPO < goalCPO && establishCPC <= maxCPC) {
      keyword.bidding().setCpc(establishCPC);
    }
  }
}
