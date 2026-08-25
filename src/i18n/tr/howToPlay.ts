import type { howToPlay as en } from '../en/howToPlay';

export const howToPlay: typeof en = {
  vampireVillage: {
    steps: [
      'Herkese gizli bir rol verilir — çoğu Köylü, birkaçı Vampir, isteğe bağlı olarak bir Kahin ve bir Koruyucu da olabilir.',
      'Gece, Vampirler sessizce bir kurban seçer, Kahin bir oyuncunun gerçek tarafını öğrenir, Koruyucu ise birini korur.',
      'Gündüz herkes şüphelendiği kişiyi tartışır, sonra birini sürgün etmek için oy verir.',
      'Her Vampir sürgün edilirse Köylüler kazanır; Vampirler yaşayanlara eşit ya da onlardan fazla olduğu an kazanır.',
    ],
  },
  taboo: {
    steps: [
      'İki takıma ayrılın. Bir oyuncu, gizli kelimeyi ya da onun yasaklı kelimelerini hiç söylemeden anlatır.',
      'Takım arkadaşları süre bitmeden kelimeyi bilmeye çalışır.',
      'Yasaklı bir kelime — ya da kelimenin kendisi — söylenirse sıra atlanır.',
      'Sırayla anlatın. En çok doğru bilen taraf kazanır.',
    ],
  },
  drawingGuess: {
    steps: [
      'Her turda bir oyuncu ressam olur ve gizli bir kelime alır.',
      'Ressam, ortak tuvale — harf ve rakam kullanmadan — kelimeyi çizerken diğerleri izleyip tahmin bağırır.',
      'Doğru bilenleri işaretle; hızlı tahminler daha çok puan getirir.',
      'Ressam da kaç kişinin bildiğine göre puan kazanır. Herkes sırayla ressam olur.',
    ],
  },
  zarta: {
    steps: [
      'Bir genel kültür sorusu gelir. Herkes gizlice grubu kandırabileceğini düşündüğü bir cevap yazar — gerçek cevap da anonim olarak aralarına karışır.',
      'Sonra herkes gerçek olduğuna inandığı cevaba oy verir. Kendi cevabına oy veremezsin.',
      'Gerçeği bulursan 1 puan kazanırsın. Birinin kandığı bir yalan yazdıysan, kandırdığın her kişi için 2 puan kazanırsın.',
      'Her turdan sonra en yüksek puan kazanır.',
    ],
  },
  story: {
    steps: [
      'Bir parça seç — başlamak için bir ya da iki cümle.',
      'Birlikte okuyun ve hikayenin gerisinin nereye gittiğini yüksek sesle, grup olarak tartışın.',
      'Burada puan yok — bu bir yarış değil, bir sohbet başlatıcısı.',
      'Ücretsiz parçalar her zaman açık; premium olanlar daha fazlasının kilidini açar.',
    ],
  },
  detective: {
    steps: [
      'Bir vaka seç ve tanıtımını birlikte okuyun.',
      'Cevabı açıklamadan önce grup olarak vakayı çözmeye çalışın.',
      'Bu iş birlikçi bir oyun, rekabetçi değil — herkes aynı taraftadır.',
      'Ücretsiz vakalar her zaman açık; premium olanlar daha fazlasının kilidini açar.',
    ],
  },
  agent: {
    steps: ['Bu oyunun kuralları henüz tasarlanmadı — hazır olduğunda tekrar bak.'],
  },
  imposter: {
    steps: [
      'Bir oyuncu (Sahtekar) hariç herkese bir kategoriden — Para, Yer, Yıl ve daha fazlası — aynı gizli değer gösterilir.',
      'Değeri açıkça söylemeden yüksek sesle konuşun. Sahtekar, değeri bilmeden aranıza karışmaya çalışır.',
      'İstediğin an birini suçlamak için oylama başlat — doğru bilirseniz Sahtekar hariç herkes kazanır.',
      'Sahtekar da değeri doğrudan tahmin edebilir, bir kere — doğru bilirse tek başına kazanır.',
      'Süre bitene kadar kimse bulamazsa berabere biter.',
    ],
  },
};
