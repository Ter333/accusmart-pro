import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard SYSCOHADA Chart of Accounts (Classes 1-7)
const OHADA_ACCOUNTS = [
  // CLASS 1 — Comptes de Ressources Durables (Equity & Long-term Liabilities)
  { account_number: "101", account_name: "Capital social", account_class: 1 },
  { account_number: "106", account_name: "Réserves", account_class: 1 },
  { account_number: "109", account_name: "Actionnaires, capital souscrit non appelé", account_class: 1 },
  { account_number: "110", account_name: "Report à nouveau", account_class: 1 },
  { account_number: "111", account_name: "Report à nouveau créditeur", account_class: 1 },
  { account_number: "112", account_name: "Report à nouveau débiteur", account_class: 1 },
  { account_number: "120", account_name: "Résultat de l'exercice (bénéfice)", account_class: 1 },
  { account_number: "129", account_name: "Résultat de l'exercice (perte)", account_class: 1 },
  { account_number: "130", account_name: "Résultat en instance d'affectation", account_class: 1 },
  { account_number: "140", account_name: "Subventions d'investissement", account_class: 1 },
  { account_number: "150", account_name: "Provisions réglementées et fonds assimilés", account_class: 1 },
  { account_number: "160", account_name: "Emprunts et dettes assimilées", account_class: 1 },
  { account_number: "161", account_name: "Emprunts obligataires", account_class: 1 },
  { account_number: "162", account_name: "Emprunts et dettes auprès des établissements de crédit", account_class: 1 },
  { account_number: "165", account_name: "Dépôts et cautionnements reçus", account_class: 1 },
  { account_number: "170", account_name: "Dettes de crédit-bail et contrats assimilés", account_class: 1 },
  { account_number: "180", account_name: "Dettes liées à des participations", account_class: 1 },
  { account_number: "190", account_name: "Provisions financières pour risques et charges", account_class: 1 },

  // CLASS 2 — Comptes d'Actif Immobilisé (Fixed Assets)
  { account_number: "201", account_name: "Frais d'établissement", account_class: 2 },
  { account_number: "202", account_name: "Charges à répartir sur plusieurs exercices", account_class: 2 },
  { account_number: "206", account_name: "Primes de remboursement des obligations", account_class: 2 },
  { account_number: "211", account_name: "Brevets, licences, logiciels", account_class: 2 },
  { account_number: "212", account_name: "Fonds commercial", account_class: 2 },
  { account_number: "213", account_name: "Avances et acomptes sur immobilisations incorporelles", account_class: 2 },
  { account_number: "215", account_name: "Droit au bail", account_class: 2 },
  { account_number: "220", account_name: "Terrains", account_class: 2 },
  { account_number: "221", account_name: "Terrains agricoles et forestiers", account_class: 2 },
  { account_number: "222", account_name: "Terrains nus", account_class: 2 },
  { account_number: "223", account_name: "Terrains bâtis", account_class: 2 },
  { account_number: "224", account_name: "Aménagements de terrains", account_class: 2 },
  { account_number: "230", account_name: "Bâtiments, installations techniques et agencements", account_class: 2 },
  { account_number: "231", account_name: "Bâtiments industriels", account_class: 2 },
  { account_number: "232", account_name: "Bâtiments commerciaux", account_class: 2 },
  { account_number: "233", account_name: "Bâtiments administratifs et sociaux", account_class: 2 },
  { account_number: "234", account_name: "Installations techniques", account_class: 2 },
  { account_number: "235", account_name: "Aménagements de bureaux", account_class: 2 },
  { account_number: "240", account_name: "Matériel", account_class: 2 },
  { account_number: "241", account_name: "Matériel et outillage industriel et commercial", account_class: 2 },
  { account_number: "244", account_name: "Matériel et mobilier de bureau", account_class: 2 },
  { account_number: "245", account_name: "Matériel de transport", account_class: 2 },
  { account_number: "250", account_name: "Avances et acomptes versés sur immobilisations", account_class: 2 },
  { account_number: "260", account_name: "Titres de participation", account_class: 2 },
  { account_number: "270", account_name: "Autres immobilisations financières", account_class: 2 },
  { account_number: "271", account_name: "Prêts et créances non commerciales", account_class: 2 },
  { account_number: "275", account_name: "Dépôts et cautionnements versés", account_class: 2 },
  { account_number: "280", account_name: "Amortissements des immobilisations", account_class: 2 },
  { account_number: "281", account_name: "Amortissements des immobilisations incorporelles", account_class: 2 },
  { account_number: "282", account_name: "Amortissements des immobilisations corporelles", account_class: 2 },
  { account_number: "290", account_name: "Provisions pour dépréciation des immobilisations", account_class: 2 },

  // CLASS 3 — Comptes de Stocks (Inventories)
  { account_number: "310", account_name: "Marchandises", account_class: 3 },
  { account_number: "311", account_name: "Marchandises A", account_class: 3 },
  { account_number: "320", account_name: "Matières premières et fournitures liées", account_class: 3 },
  { account_number: "321", account_name: "Matières premières", account_class: 3 },
  { account_number: "322", account_name: "Autres approvisionnements", account_class: 3 },
  { account_number: "330", account_name: "Autres approvisionnements", account_class: 3 },
  { account_number: "340", account_name: "Produits en cours", account_class: 3 },
  { account_number: "350", account_name: "Services en cours", account_class: 3 },
  { account_number: "360", account_name: "Produits finis", account_class: 3 },
  { account_number: "370", account_name: "Produits intermédiaires et résiduels", account_class: 3 },
  { account_number: "380", account_name: "Stocks en cours de route, en consignation", account_class: 3 },
  { account_number: "390", account_name: "Dépréciations des stocks", account_class: 3 },

  // CLASS 4 — Comptes de Tiers (Third-party Accounts)
  { account_number: "401", account_name: "Fournisseurs, dettes en compte", account_class: 4 },
  { account_number: "402", account_name: "Fournisseurs, effets à payer", account_class: 4 },
  { account_number: "408", account_name: "Fournisseurs, factures non parvenues", account_class: 4 },
  { account_number: "409", account_name: "Fournisseurs débiteurs", account_class: 4 },
  { account_number: "411", account_name: "Clients, créances en compte", account_class: 4 },
  { account_number: "412", account_name: "Clients, effets à recevoir", account_class: 4 },
  { account_number: "418", account_name: "Clients, produits à recevoir", account_class: 4 },
  { account_number: "419", account_name: "Clients créditeurs", account_class: 4 },
  { account_number: "421", account_name: "Personnel, avances et acomptes", account_class: 4 },
  { account_number: "422", account_name: "Personnel, rémunérations dues", account_class: 4 },
  { account_number: "431", account_name: "Sécurité sociale", account_class: 4 },
  { account_number: "441", account_name: "État, impôt sur les bénéfices", account_class: 4 },
  { account_number: "442", account_name: "État, autres impôts et taxes", account_class: 4 },
  { account_number: "443", account_name: "État, TVA facturée", account_class: 4 },
  { account_number: "445", account_name: "État, TVA récupérable", account_class: 4 },
  { account_number: "447", account_name: "État, impôts retenus à la source", account_class: 4 },
  { account_number: "449", account_name: "État, créances et dettes fiscales diverses", account_class: 4 },
  { account_number: "460", account_name: "Associés et groupe", account_class: 4 },
  { account_number: "470", account_name: "Débiteurs et créditeurs divers", account_class: 4 },
  { account_number: "471", account_name: "Comptes d'attente débiteurs", account_class: 4 },
  { account_number: "472", account_name: "Comptes d'attente créditeurs", account_class: 4 },
  { account_number: "476", account_name: "Charges constatées d'avance", account_class: 4 },
  { account_number: "477", account_name: "Produits constatés d'avance", account_class: 4 },
  { account_number: "478", account_name: "Écarts de conversion actif", account_class: 4 },
  { account_number: "479", account_name: "Écarts de conversion passif", account_class: 4 },
  { account_number: "490", account_name: "Dépréciations des comptes de tiers", account_class: 4 },
  { account_number: "491", account_name: "Dépréciation des comptes clients", account_class: 4 },

  // CLASS 5 — Comptes de Trésorerie (Cash & Bank)
  { account_number: "510", account_name: "Valeurs à encaisser", account_class: 5 },
  { account_number: "511", account_name: "Effets à encaisser", account_class: 5 },
  { account_number: "512", account_name: "Effets à l'encaissement", account_class: 5 },
  { account_number: "520", account_name: "Banques", account_class: 5 },
  { account_number: "521", account_name: "Banques locales", account_class: 5 },
  { account_number: "522", account_name: "Banques autres états UEMOA", account_class: 5 },
  { account_number: "523", account_name: "Banques hors UEMOA", account_class: 5 },
  { account_number: "530", account_name: "Établissements financiers et assimilés", account_class: 5 },
  { account_number: "540", account_name: "Instruments de trésorerie", account_class: 5 },
  { account_number: "560", account_name: "Banques, crédits de trésorerie", account_class: 5 },
  { account_number: "570", account_name: "Caisse", account_class: 5 },
  { account_number: "571", account_name: "Caisse siège social", account_class: 5 },
  { account_number: "580", account_name: "Régies d'avances et accréditifs", account_class: 5 },
  { account_number: "590", account_name: "Dépréciations de trésorerie", account_class: 5 },

  // CLASS 6 — Comptes de Charges (Expenses)
  { account_number: "601", account_name: "Achats de marchandises", account_class: 6 },
  { account_number: "602", account_name: "Achats de matières premières", account_class: 6 },
  { account_number: "604", account_name: "Achats stockés de matières et fournitures", account_class: 6 },
  { account_number: "605", account_name: "Autres achats", account_class: 6 },
  { account_number: "608", account_name: "Achats d'emballages", account_class: 6 },
  { account_number: "610", account_name: "Transports", account_class: 6 },
  { account_number: "611", account_name: "Transports sur achats", account_class: 6 },
  { account_number: "612", account_name: "Transports sur ventes", account_class: 6 },
  { account_number: "613", account_name: "Transports pour le compte de tiers", account_class: 6 },
  { account_number: "618", account_name: "Autres frais de transport", account_class: 6 },
  { account_number: "621", account_name: "Sous-traitance générale", account_class: 6 },
  { account_number: "622", account_name: "Locations et charges locatives", account_class: 6 },
  { account_number: "623", account_name: "Redevances de crédit-bail", account_class: 6 },
  { account_number: "624", account_name: "Entretien, réparations et maintenance", account_class: 6 },
  { account_number: "625", account_name: "Primes d'assurance", account_class: 6 },
  { account_number: "626", account_name: "Études, recherches et documentation", account_class: 6 },
  { account_number: "627", account_name: "Publicité, publications, relations publiques", account_class: 6 },
  { account_number: "628", account_name: "Frais de télécommunications", account_class: 6 },
  { account_number: "630", account_name: "Autres charges externes", account_class: 6 },
  { account_number: "631", account_name: "Frais bancaires", account_class: 6 },
  { account_number: "632", account_name: "Rémunérations d'intermédiaires et de conseils", account_class: 6 },
  { account_number: "633", account_name: "Frais de formation du personnel", account_class: 6 },
  { account_number: "634", account_name: "Redevances pour brevets et licences", account_class: 6 },
  { account_number: "635", account_name: "Cotisations", account_class: 6 },
  { account_number: "637", account_name: "Rémunérations de personnel extérieur", account_class: 6 },
  { account_number: "638", account_name: "Autres charges externes diverses", account_class: 6 },
  { account_number: "641", account_name: "Impôts et taxes directs", account_class: 6 },
  { account_number: "645", account_name: "Impôts et taxes indirects", account_class: 6 },
  { account_number: "646", account_name: "Droits d'enregistrement", account_class: 6 },
  { account_number: "648", account_name: "Autres impôts et taxes", account_class: 6 },
  { account_number: "651", account_name: "Pertes sur créances clients", account_class: 6 },
  { account_number: "652", account_name: "Quote-part de résultat sur opérations faites en commun", account_class: 6 },
  { account_number: "654", account_name: "Valeurs comptables des cessions d'immobilisations", account_class: 6 },
  { account_number: "658", account_name: "Charges diverses", account_class: 6 },
  { account_number: "659", account_name: "Charges provisionnées d'exploitation", account_class: 6 },
  { account_number: "661", account_name: "Rémunérations directes versées au personnel", account_class: 6 },
  { account_number: "662", account_name: "Indemnités et avantages divers", account_class: 6 },
  { account_number: "663", account_name: "Indemnités forfaitaires versées au personnel", account_class: 6 },
  { account_number: "664", account_name: "Charges sociales", account_class: 6 },
  { account_number: "666", account_name: "Part patronale des cotisations sociales", account_class: 6 },
  { account_number: "668", account_name: "Autres charges sociales", account_class: 6 },
  { account_number: "671", account_name: "Intérêts des emprunts", account_class: 6 },
  { account_number: "672", account_name: "Intérêts dans loyers de crédit-bail", account_class: 6 },
  { account_number: "674", account_name: "Escomptes accordés", account_class: 6 },
  { account_number: "676", account_name: "Pertes de change", account_class: 6 },
  { account_number: "677", account_name: "Pertes sur cessions de titres de placement", account_class: 6 },
  { account_number: "678", account_name: "Charges financières diverses", account_class: 6 },
  { account_number: "679", account_name: "Charges provisionnées financières", account_class: 6 },
  { account_number: "681", account_name: "Dotations aux amortissements d'exploitation", account_class: 6 },
  { account_number: "691", account_name: "Dotations aux provisions d'exploitation", account_class: 6 },
  { account_number: "697", account_name: "Dotations aux provisions financières", account_class: 6 },
  { account_number: "699", account_name: "Charges HAO (Hors Activité Ordinaire)", account_class: 6 },

  // CLASS 7 — Comptes de Produits (Revenue)
  { account_number: "701", account_name: "Ventes de marchandises", account_class: 7 },
  { account_number: "702", account_name: "Ventes de produits finis", account_class: 7 },
  { account_number: "703", account_name: "Ventes de produits intermédiaires", account_class: 7 },
  { account_number: "704", account_name: "Ventes de produits résiduels", account_class: 7 },
  { account_number: "705", account_name: "Travaux facturés", account_class: 7 },
  { account_number: "706", account_name: "Services vendus", account_class: 7 },
  { account_number: "707", account_name: "Produits accessoires", account_class: 7 },
  { account_number: "711", account_name: "Subventions d'exploitation", account_class: 7 },
  { account_number: "712", account_name: "Production immobilisée", account_class: 7 },
  { account_number: "718", account_name: "Autres produits", account_class: 7 },
  { account_number: "721", account_name: "Production stockée (ou déstockage)", account_class: 7 },
  { account_number: "726", account_name: "Remises obtenues", account_class: 7 },
  { account_number: "734", account_name: "Quote-part de résultat sur opérations faites en commun", account_class: 7 },
  { account_number: "736", account_name: "Transferts de charges d'exploitation", account_class: 7 },
  { account_number: "741", account_name: "Produits de participations", account_class: 7 },
  { account_number: "744", account_name: "Revenus de titres de placement", account_class: 7 },
  { account_number: "746", account_name: "Escomptes obtenus", account_class: 7 },
  { account_number: "748", account_name: "Gains de change", account_class: 7 },
  { account_number: "754", account_name: "Produits des cessions de titres de placement", account_class: 7 },
  { account_number: "756", account_name: "Gains de change sur opérations financières", account_class: 7 },
  { account_number: "758", account_name: "Produits financiers divers", account_class: 7 },
  { account_number: "771", account_name: "Reprises de provisions d'exploitation", account_class: 7 },
  { account_number: "772", account_name: "Reprises d'amortissements", account_class: 7 },
  { account_number: "775", account_name: "Reprises de provisions financières", account_class: 7 },
  { account_number: "781", account_name: "Transferts de charges financières", account_class: 7 },
  { account_number: "791", account_name: "Reprises de provisions HAO", account_class: 7 },
  { account_number: "799", account_name: "Produits HAO (Hors Activité Ordinaire)", account_class: 7 },
  { account_number: "754", account_name: "Produits des cessions d'immobilisations", account_class: 7 },
  { account_number: "757", account_name: "Produits exceptionnels sur opérations de gestion", account_class: 7 },
  { account_number: "798", account_name: "Transferts de charges HAO", account_class: 7 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if accounts already exist
    const { count } = await supabase
      .from("accounts")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ message: `Accounts already seeded (${count} accounts exist)` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Use unique account numbers to avoid duplicates
    const uniqueAccounts = new Map();
    for (const acc of OHADA_ACCOUNTS) {
      if (!uniqueAccounts.has(acc.account_number)) {
        uniqueAccounts.set(acc.account_number, acc);
      }
    }

    const accountsToInsert = Array.from(uniqueAccounts.values()).map((acc) => ({
      ...acc,
      is_custom: false,
    }));

    const { error } = await supabase.from("accounts").insert(accountsToInsert);

    if (error) {
      throw new Error(`Failed to seed accounts: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ message: `Successfully seeded ${accountsToInsert.length} OHADA accounts` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
