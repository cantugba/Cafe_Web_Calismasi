$(function name() {


    /*
.on metodu içinde input textarea için click yerine keyup keypress gibi eventleri select içinse change eventini kullanabilirsin.

    */

    var setIntervalDegisken; //Verilerin gelip gelmediğini kontrol eden ıntervalin değişkeni
    var setIntervalKontrol = []; // Giris yapılırken verilerin gelip gelmediğini kontrol eden degisken (3 adet bool türünde değişken alıyor.)
    var kullaniciId; // CadeId degerimiz
    var siparisler = {}; // firebasede siparisleri tutan dizi
    var masalar = {}; // firebasede masaları tutan dizi
    var masalarSiparisVerilen = {}; // firebasede siparişi olan masaları tutan dizi
    var muzikler = []; // firebasede muzikleri tutan dizi
    var menuSpanId = "#Siparisler"; // menü gecislerinde hangi secenekde oldumuzu tutuyor. Başkangıc olarak Siparisler'den başlıyor.
    $("#dataItemList").on("click", "#Siparis", function () {
        $(this).parent().hide();
        var siparisKey = $(this).attr("siparisKey");
        var yedek = {
            adet: siparisler[siparisKey]["adet"],
            fiyat: siparisler[siparisKey]["fiyat"],
            siparis: siparisler[siparisKey]["siparis"],
            key: siparisKey,
        };
        $.FirebaseList.MasalarSiparisVerilenAdd(yedek, siparisler[siparisKey]["masaId"]);
        $.FirebaseIslem.SiparisTamamlama(siparisKey);
        delete siparisler[siparisKey];
    });
    $("#dataItemList").on("click", "#MasalarClick", function () {
        var masalarSiparisVerilenKey = $(this).attr("masaKey");
        $.Yonlendirme.MasaSiparisYonlendir(masalarSiparisVerilenKey);
    });
    $("#dataItemList").on("click", "#ucretYaz", function () {

        var masaKey = $(this).attr("masaKey");
        $.FirebaseIslem.SiparisSil(masaKey);
        delete masalarSiparisVerilen[masaKey];
        $.Yonlendirme.MasaYonlendir();
    });

    $.FirebaseIslem = {
        FirebaseSiparisleriGetir: function () {
            setIntervalKontrol[0] = false;
            var myref = firebase.database().ref(kullaniciId).child("siparisler").orderByChild("tarih");
            myref.on('value', function (snaphot) {
                var siparislerYedek = [];
                snaphot.forEach(function (childSnapshot) {
                    if (childSnapshot.val()["siparisDurum"] == 0) { // siparişi hazir olmayanları alıyoruz
                        if (childSnapshot.val()["tarih"] != null)
                            siparislerYedek.push({
                                adet: childSnapshot.val()["adet"],
                                fiyat: childSnapshot.val()["fiyat"],
                                masaId: childSnapshot.val()["masaId"],
                                siparis: childSnapshot.val()["siparis"],
                                key: childSnapshot.key,
                                zaman: childSnapshot.val()["tarih"],
                            });
                    }

                    else {
                        if (!setIntervalKontrol[0]) {
                            // yeni sipariş geldiğinde tüm veriyi tekrardan çekiyor. Üst üste binmesini engellemek için
                            // intervalin başayıp başlamadığını kontrol ediyoruz
                            var yedek = {
                                adet: childSnapshot.val()["adet"],
                                fiyat: childSnapshot.val()["fiyat"],
                                siparis: childSnapshot.val()["siparis"],
                                key: childSnapshot.key,
                            };
                            $.FirebaseList.MasalarSiparisVerilenAdd(yedek, childSnapshot.val()["masaId"]);
                        }
                    }
                });
                setIntervalKontrol[0] = true;
                $.FirebaseList.SiparislerDizisiEkleme(siparislerYedek);
            });
        },

        FirebaseMasalariGetir: function () {
            setIntervalKontrol[1] = false;
            var myref = firebase.database().ref(kullaniciId).child("tables").orderByChild("Number");
            myref.on('value', function (snaphot) {
                snaphot.forEach(function (childSnapshot) {
                    $.FirebaseList.MasaAdd(childSnapshot.key, childSnapshot.val()["Number"]);
                });
                setIntervalKontrol[1] = true;
            });
        },

        FirebaseMuzikleriGetir: function () {
            setIntervalKontrol[2] = false;
            var myref = firebase.database().ref(kullaniciId).child("musics").orderByChild("vote");
            myref.on("value", function (snaphot) {
                muzikler = [] // her gelişte üst üste eklemesin diye sıfırlanıyor
                snaphot.forEach(function (childSnapshot) {
                    $.FirebaseList.MuziklerAdd(childSnapshot.val()["musicName"], childSnapshot.key);
                });
                setIntervalKontrol[2] = true;
                if (menuSpanId == "#Muzikler") // eğer sayfada muziklerde isek, oylanmış halde gelen müzikler güncellenecek
                    $.Muzikler.MuzikDataEkle();

            });
        },
        // SiparisTamamlama firabesede yer alan sipariş listesindeki ilgili siparişin 'siparisDurum' childini  1 olarak değiştirir.
        SiparisTamamlama: function (SiparisId) {
            firebase.database().ref(kullaniciId).child("siparisler").child(SiparisId).update({
                siparisDurum: 1
            });
        },
        // Ucret ödemesi yapılan siparişleri silme
        SiparisSil: function (MasaKeyID) {
            for (let index = 0; index < masalarSiparisVerilen[MasaKeyID].length; index++) {
                firebase.database().ref(kullaniciId).child("siparisler").child(masalarSiparisVerilen[MasaKeyID][index]["siparisKey"]).remove();
            }

            $.FirebaseIslem.MasaSifirla(MasaKeyID);

        },
        MasaSifirla: function (MasaKey) {
            firebase.database().ref(kullaniciId).child("tables").child(MasaKey).update({ voteTime: "09:00" });
        },
        Giris: function () {
            var id = "#girisKontrol";
            var idLoading = "#loading";

            //  var kullaniciAdi = $("#kullaniciMail").val();
            // var kullaniciSifre = $("#kullaniciSifre").val();
            $.CssIslem.ToggleYap(idLoading);
            $.CssIslem.FlexAyarlama(id);

            var ref = firebase.auth();
            ref.signInWithEmailAndPassword("tugbacan@hotmail.com", "tugbacan123").catch(function (error) {
                alert("Kullanici adi veya şifre hatalı");
                $.CssIslem.ToggleYap(id);
                $.CssIslem.ToggleYap(idLoading);
                // var errorCode = error.code;
                // var errorMessage = error.message;
            }).then(function name(params) {

                kullaniciId = params.user.uid;
                $(id).html("Veriler Cekiliyor.");

                $.FirebaseIslem.FirebaseMuzikleriGetir();
                $.FirebaseIslem.FirebaseMasalariGetir();
                $.FirebaseIslem.FirebaseSiparisleriGetir();
                $.IntervalIslem.VeriKontrol();

            });
        }
    }

    $.FirebaseList = {
        SiparislerDizisiEkleme: function (FirebaseArray) { // siparis dizisine ekleme yapılmadan önce kontorl yapılıyor. Burdan ekleme icin  SiparisDizisiEkleme2 fonksiyonuna gidiliyor
            var siparisUzunluk = $.FirebaseList.SiparisDiziUzunluk();
            if (siparisUzunluk <= 0) // ilk eklememi yoksa eklendikten sonra müşterilerden gelen sipariş verilerimi diye kontol
            {

                for (let index = 0; index < FirebaseArray.length; index++) {
                    $.FirebaseList.SiparisDizisiEkleme2(FirebaseArray[index]);
                }
                $.Siparis.SiparisDataEkle();

            }

            else {
                var sistemSaati = (new Date().getHours() + ":" + new Date().getMinutes()).split(":");
                var fark = FirebaseArray.length - (FirebaseArray.length - siparisUzunluk);
                for (let index = fark; index < FirebaseArray.length; index++) {
                    var dakikaFark = $.RenkVeDakkaFarki.DakkaFarkiBul(FirebaseArray[index]["zaman"], sistemSaati);
                    var spanRenk = $.RenkVeDakkaFarki.SpanRenkKoduBelirle(dakikaFark);
                    var spanHtml = $.Siparis.SiparisSpanHtml(FirebaseArray[index], masalar[FirebaseArray[index]["masaId"]], FirebaseArray[index]["key"], spanRenk, dakikaFark);
                    $.IslemHtml.AppendHtml(spanHtml);

                    $.FirebaseList.SiparisDizisiEkleme2(FirebaseArray[index]);
                }

            }

            console.log(siparisler);
        },
        SiparisDiziUzunluk: function () { // siparis dizisi objeck olduğundan length kullanılmıyor
            var uzunluk = 0;
            for (let key in siparisler)
                uzunluk++;
            return uzunluk;
        },
        SiparisDizisiEkleme2: function (Data) { // siparisler dizisine ekleme işlemi
            //sipariş keyi = Data["key"];
            siparisler[Data["key"]] = {
                adet: Data["adet"],
                fiyat: Data["fiyat"],
                masaId: Data["masaId"],
                siparis: Data["siparis"],
                zaman: Data["zaman"],
            }
        },
        MasalarSiparisVerilenAdd: function (childSnapshot, key) {

            if (masalarSiparisVerilen[key]) { // eğer daha önceden bu masaya ait sipariş varsa, onu kendine ait olan diziye ekle
                masalarSiparisVerilen[key].push({
                    adet: childSnapshot["adet"],
                    fiyat: childSnapshot["fiyat"],
                    siparis: childSnapshot["siparis"],
                    siparisKey: childSnapshot["key"],

                });
            }
            else { // eğer daha önceden bu masada sipariş veren yok ise, o keye ait dizi oluştur ve içine pushla
                masalarSiparisVerilen[key] = [];
                masalarSiparisVerilen[key].push({
                    adet: childSnapshot["adet"],
                    fiyat: childSnapshot["fiyat"],
                    siparis: childSnapshot["siparis"],
                    siparisKey: childSnapshot["key"],

                });
            }

        },
        MuziklerAdd: function (MusicName, MuzikKey) {
            muzikler.push({
                muzikAdi: MusicName,
                key: MuzikKey
            });
        },
        MasaAdd: function (MasaKey, MasaNumara) {
            masalar[MasaKey] = MasaNumara;
        }


    }
    // interval işlemleri,
    $.IntervalIslem = {
        VeriKontrol: function () // firebaseden verinin gelip gelmediğini kontrol ediyor.
        {
            setIntervalDegisken = setInterval(() => {
                if (setIntervalKontrol[0] && setIntervalKontrol[1] && setIntervalKontrol[2]) {
                    $.CssIslem.ToggleYap("#girisDiv, #islemDiv, #girisKontrol");
                    $.CssIslem.IslemDivCss();
                    $.Siparis.SiparisHeaderEkle();
                    $.CssIslem.SpanClickColor("#Siparisler");
                    $.IntervalIslem.SiparisZamanKontrol();
                    clearInterval(setIntervalDegisken);
                }
            }, 500);
        },
        SiparisZamanKontrol: function () // siparişler sayfasındayken
        {

            setInterval(() => {
                if (menuSpanId == "#Siparisler") {
                    var sistemSaati = (new Date().getHours() + ":" + new Date().getMinutes()).split(":");
                    for (let key in siparisler) {
                        var dakikaFark = $.RenkVeDakkaFarki.DakkaFarkiBul(siparisler[key]["zaman"], sistemSaati);
                        var id = "#Spanü" + key;
                        var renkKodu = $.RenkVeDakkaFarki.SpanRenkKoduBelirle(dakikaFark);

                        $(id).html(dakikaFark + " dk");
                        $(id).css('background-color', renkKodu);
                    }
                }
            }, 14000);
        },
    }

    $.IslemHtml = {

        IcerikBosalt: function ()// idsi verilen html tagının icersini boşaltıyor
        {
            $("#dataItemList").html("");
        },
        AppendHtml: function (Html)//"#dataItemList divi icersine eleman ekleme
        {
            $("#dataItemList").append(Html);
        },
        HeaderEkle: function (Html) {
            $("#dataDivItemHeader").html(Html);
        },
    }

    $.RenkVeDakkaFarki = {
        DakkaFarkiBul: function (SiparisSaat, SistemSaati) {
            if (SiparisSaat != null) {
                var siparisTarihi = SiparisSaat.split(":");
                var dakkaFark = (SistemSaati[1]) - (siparisTarihi[1]) + ((SistemSaati[0] - siparisTarihi[0]) * 60);
            }
            else
                dakkaFark = 0;
            return dakkaFark;
        },
        SpanRenkKoduBelirle: function (Dakka) {
            var renk;
            if (Dakka >= 0 && Dakka < 3)
                renk = "rgb(243, 235, 236)";
            else if (Dakka >= 3 && Dakka < 6)
                renk = "rgb(250, 183, 187)";
            else if (Dakka >= 6 && Dakka < 9)
                renk = "rgb(245, 114, 125)";
            else if (Dakka >= 9)
                renk = "rgb(250, 21, 41)";
            return renk;
        }
    }

    // yonlendirme fonksiyon sınıfı, menude tıklamalara göre ilgili divi gösterme işlevi
    $.Yonlendirme = {
        SiparisYonlendir: function () {
            $.CssIslem.SpanClickColor('#Siparisler');
            $.Siparis.SiparisHeaderEkle();
            $.Siparis.SiparisDataEkle();
        },
        MasaYonlendir: function () {
            $.CssIslem.SpanClickColor('#Masalar');
            $.Masa.MasaHeaderEkle();
            $.Masa.MasaDataEkle();
        },
        MasaSiparisYonlendir: function (Key) {
            $.CssIslem.SpanClickColor("");
            $.MasaSiparis.MasaSiparisHeaderEkle();
            $.MasaSiparis.MasaSiparisDataEkle(Key);
        },
        MuzikYonlendir: function () {
            $.CssIslem.SpanClickColor('#Muzikler')
            $.Muzikler.MuzikHeaderEkle();
            $.Muzikler.MuzikDataEkle();
        },
    }

    $.CssIslem = {
        IslemDivCss: function ()
        // Sayfada 2 ana div var. Giriş divi, siparişlerin, müziklerin ve masaların listelendiği islemDivi. Giriş yapıldığında giriş divi gizlenip, islem divi show yapılır.
        // Show yapıldığında divin hizalaama ayarları bu fonksiyonda yapılıyor.
        {
            $("div#islemDiv").css({
                'display': 'flex',
                'flex-direction': 'column',
                'align-items': 'center'
            });
        },
        SpanClickColor: function (Id)
        // menude tıklanmalara göre spanların arka rengini ayarlıyor.
        {
            $(menuSpanId).css("background-color", "9033fa");
            $(Id).css("background-color", "##rgb(30, 241, 143)");
            $(Id).css("color", "white");
            menuSpanId = Id;
        },
        FlexAyarlama: function (Id)
        // ıdsi verilen div icin hizalama ayarları yapıyor.
        {
            $(Id).css({
                "display": "flex",
                "align-items": "center",
                "justify-content": "space-around"
            });
        },
        ToggleYap: function (Id) {
            $(Id).toggle();
        }

    }

    $.Siparis = {
        SiparisHeaderEkle: function () {
            var masaNo = "<span >Masa No</span>";
            var siparis = "<span>Sipariş</span>";
            var adet = "<span>Adet</span>";
            var beklemeZamani = "<span>Bekleme Zamanı</span>";
            var siparisHazirlandi = "<span>Sipariş Hazirlandı</span>";
            $.IslemHtml.HeaderEkle(masaNo + siparis + adet + beklemeZamani + siparisHazirlandi);
        },

        SiparisDataEkle: function () {
            $.IslemHtml.IcerikBosalt();// icerik boşaltılıyor.
            var sistemSaati = (new Date().getHours() + ":" + new Date().getMinutes()).split(":");
            for (let key in siparisler) {

                var dakikaFark = $.RenkVeDakkaFarki.DakkaFarkiBul(siparisler[key]["zaman"], sistemSaati);
                var spanRenk = $.RenkVeDakkaFarki.SpanRenkKoduBelirle(dakikaFark);
                var spanHtml = $.Siparis.SiparisSpanHtml(siparisler[key], masalar[siparisler[key]["masaId"]], key, spanRenk, dakikaFark);
                $.IslemHtml.AppendHtml(spanHtml);
            }

        },
        SiparisSpanHtml: function (Data, MasaNo, DataIndex, SpanRenkKodu, BeklemeSuresi) {

            var divAcilis = '<div class="dataDivItem-boyut dataDivItem-gorsel dataDivItem-hizalama">';
            var masaNo = "<span>" + MasaNo + "</span>";
            var urunAdi = "<span>" + Data["siparis"] + "</span>";
            var adet = "<span>" + Data["adet"] + "</span>";
            var beklemeSuresi = '<span  style=background-color:' + SpanRenkKodu + ' id=Spanü' + DataIndex + '>' + BeklemeSuresi + 'dk</span>';
            var siparisButton = '<button id=Siparis  siparisKey=' + DataIndex + '>Sipariş Hazirlandı</button>';
            var divKapanis = '</div>';
            return divAcilis + masaNo + urunAdi + adet + beklemeSuresi + siparisButton + divKapanis;

        }
    }

    $.Masa = {
        MasaHeaderEkle: function () {
            var span = "<span>Siparis Veren Masalar</span>";
            $.IslemHtml.HeaderEkle(span);

        },
        MasaDataEkle: function () {
            $.IslemHtml.IcerikBosalt();

            for (let index in masalar)
                if (masalarSiparisVerilen[index])
                    $.Masa.MasaHtml(index);

        },
        MasaHtml: function (MasaKey) {
            var divAcilis = "<div class='dataDivItem-boyut dataDivItem-gorsel dataDivItem-hizalama'>";
            var span = "<span masaKey=" + MasaKey + " id=MasalarClick>" + masalar[MasaKey] + "</span>";
            var divKapanis = "</div>"
            $.IslemHtml.AppendHtml(divAcilis + span + divKapanis);
        }
    }

    $.Muzikler = {
        MuzikHeaderEkle: function () {
            var span = "<span>Müzik Adı</span>";
            $.IslemHtml.HeaderEkle(span);
        },
        MuzikDataEkle: function () {
            $.IslemHtml.IcerikBosalt();

            for (let index = muzikler.length - 1; index >= 0; index--) { // muzikler.length-1 başlamasının nedeni, dizi oy oranına göre kücükten büyüğe sıralıdır.
                $.Muzikler.MuzikHtml(muzikler[index]["muzikAdi"]);
            }
        },
        MuzikHtml: function (MuzikAd) {
            var divAcilis = "<div class='dataDivItem-boyut dataDivItem-gorsel dataDivItem-hizalama'>";
            var span = "<span>" + MuzikAd + "</span>";
            var divKapanis = "</div>"
            $.IslemHtml.AppendHtml(divAcilis + span + divKapanis);
        }
    }

    $.MasaSiparis = {

        MasaSiparisHeaderEkle: function () {
            var siparis = "<span> Siparis </span>";
            var adet = "<span> Adet </span>";
            var fiyat = "<span> Fiyat </span>";
            $.IslemHtml.HeaderEkle(siparis + adet + fiyat);
        },
        MasaSiparisDataEkle: function (Key) {
            $.IslemHtml.IcerikBosalt();
            var fiyat = 0;
            for (let index = 0; index < masalarSiparisVerilen[Key].length; index++) {

                fiyat = $.MasaSiparis.MasaSiparisUcret(masalarSiparisVerilen[Key][index]["fiyat"], masalarSiparisVerilen[Key][index]["adet"], fiyat);
                $.MasaSiparis.MasaSiparisHtml(masalarSiparisVerilen[Key][index]);
            }
            $.MasaSiparis.MasaSiparisUcretYaz(fiyat, Key);

        },
        MasaSiparisHtml: function (data) {
            var divAcilis = '<div class="dataDivItem-boyut dataDivItem-gorsel dataDivItem-hizalama">';
            var siparis = '<span>' + data["siparis"] + '</span>';
            var adet = '<span>' + data["adet"] + '</span>';
            var fiyat = '<span>' + data["fiyat"] + '</span>';
            var divKapanis = '</div>'
            $.IslemHtml.AppendHtml(divAcilis + siparis + adet + fiyat + divKapanis)
        },
        MasaSiparisUcret: function (Fiyat, Adet, ToplamTutar) {
            var tutar = parseFloat(Fiyat.split('t')[0]);
            var adet = parseFloat(Adet);
            ToplamTutar = ToplamTutar + (tutar * adet);
            return ToplamTutar;
        },
        MasaSiparisUcretYaz: function name(Ucret, Key) {
            var divAcilis = '<div class="dataDivItem-boyut dataDivItem-gorsel dataDivItem-hizalama">';
            var aciklamaSpan = '<span>Toplam Ucret </span>';
            var tutar = '<span>' + Ucret + 'TL</span>';
            var ode = '<button id=ucretYaz  masaKey=' + Key + '>Ode</button>';
            var divKapanis = '<div>';
            $.IslemHtml.AppendHtml(divAcilis + aciklamaSpan + tutar + ode + divKapanis);
        }


    }

});