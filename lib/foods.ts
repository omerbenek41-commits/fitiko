// n: ad, k/p/c/f: 100 g başına kalori, protein, karbonhidrat, yağ; a: 1 adet (g); s: 1 porsiyon (g)
export type Food = { n: string; k: number; p: number; c: number; f: number; a: number; s: number };

const DB = [
  // Protein
  "Tavuk göğsü (ızgara),165,31,0,3.6,100,150",
  "Tavuk but (fırın),209,26,0,11,90,150",
  "Köfte (ızgara),250,17,6,18,40,150",
  "Dana kıyma (pişmiş),254,26,0,17,100,120",
  "Biftek (ızgara),271,25,0,19,150,150",
  "Hindi füme,104,17,2,3,15,45",
  "Somon,208,20,0,13,100,150",
  "Ton balığı (konserve süzülmüş),116,26,0,1,80,80",
  "Levrek (ızgara),124,23,0,3,250,200",
  "Hamsi (tava),270,19,8,18,10,150",
  "Yumurta (haşlanmış),143,12.6,0.7,9.5,55,110",
  "Omlet (2 yumurta),154,11,1,12,120,120",
  "Menemen,105,5.5,5,7,250,250",
  "Sucuk,450,22,2,40,10,40",
  "Whey protein tozu,380,78,8,5,30,30",
  // Süt ürünleri
  "Beyaz peynir,264,17,1.5,21,30,30",
  "Kaşar peyniri,350,25,1.5,27,25,30",
  "Lor peyniri,98,11,3.4,4.3,100,100",
  "Yoğurt,61,3.5,4.7,3.3,100,150",
  "Süzme yoğurt,97,9,4,5,100,150",
  "Ayran,36,1.7,2.6,2,200,200",
  "Süt (tam yağlı),61,3.2,4.8,3.3,200,200",
  "Süt (yarım yağlı),46,3.3,4.8,1.5,200,200",
  "Kefir,55,3.3,4,3,200,200",
  // Tahıl & karbonhidrat
  "Ekmek (beyaz),265,9,49,3.2,30,60",
  "Tam buğday ekmeği,247,13,41,3.4,30,60",
  "Simit,320,10,57,6,120,120",
  "Lavaş,275,9,55,1.5,60,60",
  "Pirinç pilavı,130,2.7,28,0.3,150,150",
  "Bulgur pilavı,110,3.1,19,2.5,150,150",
  "Makarna (haşlanmış),158,5.8,31,0.9,200,200",
  "Yulaf ezmesi,389,17,66,7,40,40",
  "Patates (haşlanmış),87,1.9,20,0.1,150,150",
  "Patates kızartması,312,3.4,41,15,100,120",
  "Mısır gevreği,378,7,84,1,30,30",
  // Baklagil & sebze
  "Mercimek çorbası,55,3.5,8,1,250,250",
  "Ezogelin çorbası,60,3,9,1.5,250,250",
  "Kuru fasulye,127,8.7,23,0.5,200,200",
  "Nohut (haşlanmış),164,8.9,27,2.6,100,150",
  "Zeytinyağlı taze fasulye,70,2,8,3.5,200,200",
  "Karnıyarık,140,6,8,10,250,250",
  "İmam bayıldı,110,2,9,8,250,250",
  "Çoban salata,40,1,5,2,200,200",
  "Domates,18,0.9,3.9,0.2,120,120",
  "Salatalık,15,0.7,3.6,0.1,150,150",
  "Brokoli (haşlanmış),35,2.4,7,0.4,150,150",
  "Avokado,160,2,9,15,150,75",
  // Meyve
  "Muz,89,1.1,23,0.3,120,120",
  "Elma,52,0.3,14,0.2,180,180",
  "Portakal,47,0.9,12,0.1,180,180",
  "Çilek,32,0.7,7.7,0.3,12,150",
  "Karpuz,30,0.6,7.6,0.2,300,300",
  "Üzüm,69,0.7,18,0.2,5,150",
  "Hurma,282,2.5,75,0.4,8,40",
  // Kuruyemiş & yağ
  "Ceviz,654,15,14,65,5,30",
  "Badem,579,21,22,50,1.2,30",
  "Fındık,628,15,17,61,1.5,30",
  "Fıstık ezmesi,588,25,20,50,15,30",
  "Zeytin,145,1,4,15,4,30",
  "Zeytinyağı,884,0,0,100,5,10",
  "Tereyağı,717,0.9,0.1,81,10,10",
  "Bal,304,0.3,82,0,20,20",
  // Hazır & sokak yemekleri
  "Döner (tavuk dürüm),215,13,22,8,300,300",
  "Lahmacun,235,10,32,7,170,170",
  "Pide (kıymalı),260,12,30,10,350,350",
  "Mantı (yoğurtlu),170,7,22,6,250,250",
  "Börek (peynirli),310,9,27,18,100,120",
  "Pizza,266,11,33,10,110,220",
  "Hamburger,295,17,24,14,220,220",
  // Atıştırmalık & içecek
  "Baklava,428,6,52,22,40,80",
  "Sütlaç,130,3.5,21,3.5,200,200",
  "Bitter çikolata,546,5,60,31,10,30",
  "Türk kahvesi (şekersiz),2,0.1,0.3,0,70,70",
  "Çay (şekersiz),1,0,0.2,0,100,100",
  "Kola,42,0,10.6,0,330,330",
  "Portakal suyu,45,0.7,10,0.2,200,200",
];

export const FOODS: Food[] = DB.map((x) => {
  const [n, k, p, c, f, a, s] = x.split(",");
  return { n, k: +k, p: +p, c: +c, f: +f, a: +a, s: +s };
});

export const MEALS = ["Kahvaltı", "Öğle yemeği", "Akşam yemeği", "Ara öğün"] as const;
export const MEAL_ICONS: Record<string, string> = { Kahvaltı: "🍳", "Öğle yemeği": "🥗", "Akşam yemeği": "🍽️", "Ara öğün": "🍎" };

/** Saate göre varsayılan öğün */
export function guessMeal() {
  const h = new Date().getHours();
  return h < 11 ? "Kahvaltı" : h < 16 ? "Öğle yemeği" : h < 21 ? "Akşam yemeği" : "Ara öğün";
}
