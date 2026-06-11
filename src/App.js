import { useState, useEffect, useCallback } from 'react';

// ============ CONSTANTES ============
const CATEGORIES_INITIALES = [
    { id: 'sante', nom: 'Santé', emoji: '🏃', couleur: '#EAF3DE', couleurTexte: '#3B6D11' },
    { id: 'mental', nom: 'Mental', emoji: '🧠', couleur: '#EEEDFE', couleurTexte: '#534AB7' },
    { id: 'social', nom: 'Social', emoji: '👥', couleur: '#FAEEDA', couleurTexte: '#854F0B' },
    { id: 'competence', nom: 'Compétence', emoji: '📚', couleur: '#E6F1FB', couleurTexte: '#185FA5' },
    { id: 'default', nom: 'Autre', emoji: '📦', couleur: '#F1EFE8', couleurTexte: '#555555' },
];

const QUETES_INITIALES = [
    { id: 1, titre: '30 min de marche', desc: 'Une promenade revigorante', cat: 'sante', xp: 25, fait: false },
    { id: 2, titre: 'Lire 20 pages', desc: 'Nourrir son esprit', cat: 'mental', xp: 25, fait: false },
    { id: 3, titre: 'Boire 2L d\'eau', desc: 'Rester bien hydraté', cat: 'sante', xp: 10, fait: false },
    { id: 4, titre: 'Méditer 10 min', desc: 'Calmer le mental', cat: 'mental', xp: 15, fait: false },
    { id: 5, titre: 'Prendre des nouvelles d\'un ami', desc: 'Entretenir les liens', cat: 'social', xp: 25, fait: false },
    { id: 6, titre: 'Faire 10 min de stretching', desc: 'Assouplir son corps', cat: 'sante', xp: 10, fait: false },
    { id: 7, titre: 'Apprendre quelque chose de nouveau', desc: 'Nourrir sa curiosité', cat: 'competence', xp: 25, fait: false },
    { id: 8, titre: 'Écrire dans un journal', desc: 'Clarifier ses pensées', cat: 'mental', xp: 15, fait: false },
    { id: 9, titre: 'Rendre service à quelqu\'un', desc: 'Un geste qui fait du bien', cat: 'social', xp: 25, fait: false },
    { id: 10, titre: 'Manger un repas équilibré', desc: 'Prendre soin de son corps', cat: 'sante', xp: 15, fait: false },
];

const AVATARS = ['⚔️', '🧙', '🏹', '🛡️', '🐉', '🦸', '🧝', '🪄'];
const COULEURS_AVATAR = ['#EEEDFE', '#EAF3DE', '#FAEEDA', '#E6F1FB', '#FCEBEB', '#F1EFE8', '#E1F5EE', '#FBEAF0'];
const DIVISEUR_XP_BONUS = 5;
const DIVISEUR_XP_PERSO = 2;
const NB_QUETES_BASE = 3;
const NB_QUETES_MAX = 12;
const NB_NIVEAUX_PAR_RANG = 4;

const COULEURS_CATEGORIES = [
    { couleur: '#EAF3DE', couleurTexte: '#3B6D11' },
    { couleur: '#EEEDFE', couleurTexte: '#534AB7' },
    { couleur: '#FAEEDA', couleurTexte: '#854F0B' },
    { couleur: '#E6F1FB', couleurTexte: '#185FA5' },
    { couleur: '#FCEBEB', couleurTexte: '#993333' },
    { couleur: '#E1F5EE', couleurTexte: '#1A7A55' },
    { couleur: '#FBEAF0', couleurTexte: '#994466' },
    { couleur: '#F1EFE8', couleurTexte: '#555544' },
];

const EMOJIS_CATEGORIES = [
    '🏃', '🧠', '👥', '📚', '🎨', '🏋️', '🎯', '💡', '🌱', '🎵',
    '🍎', '💼', '🧘', '📖', '🏊', '🚴', '✍️', '🔬', '🎮', '🌍',
    '❤️', '🤝', '🧹', '💰', '🛠️', '📦', '🏐',
];

// ============ UTILITAIRES ============
function xpPourNiveau(n) { return n * 100; }

function getRang(n) {
    if (n >= 40) return 'Légende';
    if (n >= 20) return 'Maître';
    if (n >= 10) return 'Champion';
    if (n >= 5) return 'Guerrier';
    if (n >= 2) return 'Aventurier';
    return 'Apprenti';
}

function nbSlotsPerso(n) {
    const r = getRang(n);
    if (r === 'Légende') return 10;
    if (r === 'Maître') return 8;
    if (r === 'Champion') return 6;
    if (r === 'Guerrier') return 4;
    if (r === 'Aventurier') return 2;
    return 0;
}

function nbQuetesPourNiveau(n) {
    return Math.min(NB_QUETES_BASE + Math.floor((n - 1) / NB_NIVEAUX_PAR_RANG), NB_QUETES_MAX);
}

function assombrirCouleur(hex, f = 0.08) {
    if (!hex || !hex.startsWith('#') || hex.length !== 7) return '#f5f5f5';
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `#${[r, g, b].map(v => Math.max(0, Math.round(v - v * f)).toString(16).padStart(2, '0')).join('')}`;
}

function selectionnerQuotidiennes(toutes, nb = 1) {
    const cats = ['sante', 'mental', 'social', 'competence'];
    const selection = [], utilisees = new Set();
    for (const cat of cats) {
        const dispo = toutes.filter(q => q.cat === cat && !utilisees.has(q.id));
        if (!dispo.length) continue;
        const c = dispo[Math.floor(Math.random() * dispo.length)];
        selection.push({ ...c, fait: false });
        utilisees.add(c.id);
    }
    const cible = Math.min(nb, toutes.length);
    const restantes = toutes.filter(q => !utilisees.has(q.id)).sort(() => Math.random() - 0.5);
    for (const q of restantes) {
        if (selection.length >= cible) break;
        selection.push({ ...q, fait: false });
    }
    return selection;
}

function sauvegarder(data) {
    try { localStorage.setItem('dailyquest_save', JSON.stringify(data)); } catch (e) { }
}

function charger() {
    try { const d = localStorage.getItem('dailyquest_save'); return d ? JSON.parse(d) : null; } catch (e) { return null; }
}

// ============ STYLES ============
const THEME_CLAIR = {
    fond: '#f5f5f5', fondSecondaire: '#f5f5f5', texte: '#000', texteSecondaire: '#888',
    bordure: '#ccc', bordureLegere: '#eee', card: 'white', statCard: '#f5f5f5',
    triItem: '#f5f5f5', triItemActif: '#EEEDFE', inputFond: 'white',
};
const THEME_SOMBRE = {
    fond: '#1a1a2e', fondSecondaire: '#16213e', texte: '#f0f0f0', texteSecondaire: '#aaa',
    bordure: '#444', bordureLegere: '#333', card: '#0f3460', statCard: '#16213e',
    triItem: '#16213e', triItemActif: '#2d2b5e', inputFond: '#16213e',
};

const s = {
    container: { padding: 16, paddingTop: 32, minHeight: '100vh' },
    card: { borderRadius: 12, padding: 16, marginBottom: 12 },
    row: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
    btn: { padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12 },
    input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 },
    xpBarre: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    xpRemplissage: { height: 8, backgroundColor: '#7F77DD', borderRadius: 4, transition: 'width 0.3s' },
    queteCard: { borderRadius: 12, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 },
    queteIcone: { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
    checkBtn: { width: 32, height: 32, borderRadius: 16, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: 'none' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 },
    modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' },
    ajouterBtn: { backgroundColor: '#7F77DD', borderRadius: 8, padding: 12, width: '100%', border: 'none', color: 'white', fontWeight: 500, fontSize: 14, cursor: 'pointer', marginBottom: 8 },
    supprimerBtn: { borderRadius: 8, padding: 12, width: '100%', border: '1px solid #ffcccc', backgroundColor: '#fff5f5', color: '#cc3333', fontSize: 14, cursor: 'pointer', marginBottom: 8 },
    tabBar: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', borderTop: '1px solid #eee', zIndex: 100 },
    tabBtn: { flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
};

// ============ COMPOSANT PRINCIPAL ============
export default function App() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [darkMode, setDarkMode] = useState(null);
    const theme = (darkMode === null ? prefersDark : darkMode) ? THEME_SOMBRE : THEME_CLAIR;

    const [onglet, setOnglet] = useState('home');
    const [charge, setCharge] = useState(false);

    // Stats
    const [xp, setXp] = useState(0);
    const [niveau, setNiveau] = useState(1);
    const [xpTotal, setXpTotal] = useState(0);
    const [xpAujourdhui, setXpAujourdhui] = useState(0);
    const [quetesTotal, setQuetesTotal] = useState(0);
    const [afficherTotalQuetes, setAfficherTotalQuetes] = useState(false);
    const [afficherXpTotal, setAfficherXpTotal] = useState(false);

    // Quêtes
    const [quetes, setQuetes] = useState(QUETES_INITIALES.slice(0, 3));
    const [toutesQuetes, setToutesQuetes] = useState(QUETES_INITIALES);
    const [nextId, setNextId] = useState(11);
    const [tri, setTri] = useState('defaut');
    const [triVisible, setTriVisible] = useState(false);
    const [rerollUtilise, setRerollUtilise] = useState(false);
    const [bonusValides, setBonusValides] = useState([]);
    const [bonusVisible, setBonusVisible] = useState(false);
    const [quetesPerso, setQuetesPerso] = useState([]);
    const [quetesPersoFaites, setQuetesPersoFaites] = useState([]);
    const [persoVisible, setPersoVisible] = useState(false);

    // Profil
    const [nomJoueur, setNomJoueur] = useState('Héros du quotidien');
    const [avatar, setAvatar] = useState('⚔️');
    const [couleurAvatar, setCouleurAvatar] = useState('#EEEDFE');

    // Catégories
    const [categories, setCategories] = useState(CATEGORIES_INITIALES);

    // Modals
    const [modalProfil, setModalProfil] = useState(false);
    const [nomTemp, setNomTemp] = useState('');
    const [avatarTemp, setAvatarTemp] = useState('⚔️');
    const [couleurAvatarTemp, setCouleurAvatarTemp] = useState('#EEEDFE');
    const [colorPickerVisible, setColorPickerVisible] = useState(false);

    const couleurFond = assombrirCouleur(couleurAvatar, 0.08);
    const xpRequis = xpPourNiveau(niveau);
    const pct = Math.min(100, Math.round((xp / xpRequis) * 100));
    const faitesAujourdhui = quetes.filter(q => q.fait).length;

    function getCat(id) {
        return categories.find(c => c.id === id) || categories.find(c => c.id === 'default') || CATEGORIES_INITIALES[4];
    }

    // ============ CHARGEMENT ============
    useEffect(() => {
        const s = charger();
        if (s) {
            const aujourdhui = new Date().toDateString();
            const toutesLesQuetes = s.toutesQuetes || QUETES_INITIALES;
            setToutesQuetes(toutesLesQuetes);
            if (s.derniereDate !== aujourdhui) {
                setXpAujourdhui(0);
                const perso = s.quetesPerso || [];
                const quotidiennesHier = s.quotidiennes || [];
                const uniquesValidees = quotidiennesHier.filter(q => q.unique && q.fait).map(q => q.id);
                const toutesApresSuppr = toutesLesQuetes.filter(q => !uniquesValidees.includes(q.id));
                setToutesQuetes(toutesApresSuppr);
                setQuetes(selectionnerQuotidiennes(toutesApresSuppr.filter(q => !perso.includes(q.id)), nbQuetesPourNiveau(s.niveau || 1)));
                setRerollUtilise(false);
                setBonusValides([]);
            } else {
                setQuetes(s.quotidiennes || selectionnerQuotidiennes(toutesLesQuetes, nbQuetesPourNiveau(s.niveau || 1)));
                setRerollUtilise(s.rerollUtilise || false);
                setBonusValides(s.bonusValides || []);
                setQuetesPerso(s.quetesPerso || []);
                setQuetesPersoFaites(s.quetesPersoFaites || []);
                setXpAujourdhui(s.xpAujourdhui || 0);
            }
            setXp(s.xp || 0);
            setNiveau(s.niveau || 1);
            setXpTotal(s.xpTotal || 0);
            setNextId(s.nextId || 11);
            setNomJoueur(s.nomJoueur || 'Héros du quotidien');
            setAvatar(s.avatar || '⚔️');
            setCouleurAvatar(s.couleurAvatar || '#EEEDFE');
            setCategories(s.categories || CATEGORIES_INITIALES);
            setQuetesTotal(s.quetesTotal || 0);
            if (s.darkMode !== undefined) setDarkMode(s.darkMode);
        }
        setCharge(true);
    }, []);

    // ============ SAUVEGARDE ============
    useEffect(() => {
        if (!charge) return;
        sauvegarder({
            xp, niveau, xpTotal, xpAujourdhui, nextId, couleurAvatar, nomJoueur, avatar,
            toutesQuetes, rerollUtilise, quetesTotal, bonusValides, darkMode,
            quetesPerso, quetesPersoFaites, categories,
            quotidiennes: quetes, derniereDate: new Date().toDateString(),
        });
    }, [xp, niveau, xpTotal, xpAujourdhui, quetes, toutesQuetes, nextId, nomJoueur, avatar,
        charge, couleurAvatar, rerollUtilise, quetesTotal, bonusValides, darkMode,
        quetesPerso, quetesPersoFaites, categories]);

    // ============ ACTIONS ============
    function gagnerXp(montant, nouveauNiveau, nouvelXp) {
        let nx = nouvelXp, nn = nouveauNiveau;
        while (nx >= xpPourNiveau(nn)) { nx -= xpPourNiveau(nn); nn++; }
        setXp(nx); setNiveau(nn);
        return { nx, nn };
    }

    function validerQuete(id) {
        const quete = quetes.find(q => q.id === id);
        if (!quete || quete.fait) return;
        const nouvellesQuetes = quetes.map(q => q.id === id ? { ...q, fait: true } : q);
        setQuetes(nouvellesQuetes);
        setToutesQuetes(prev => prev.map(q => q.id === id ? { ...q, completions: (q.completions || 0) + 1 } : q));
        setXpTotal(prev => prev + quete.xp);
        setXpAujourdhui(prev => prev + quete.xp);
        setQuetesTotal(prev => prev + 1);
        let nx = xp + quete.xp, nn = niveau;
        while (nx >= xpPourNiveau(nn)) { nx -= xpPourNiveau(nn); nn++; if (nn > niveau) alert(`🎉 Niveau supérieur ! Vous atteignez le niveau ${nn} !`); }
        setXp(nx); setNiveau(nn);
        if (nouvellesQuetes.every(q => q.fait)) {
            const bonusXp = Math.max(10, Math.floor(xpPourNiveau(nn) / 10));
            let bx = nx + bonusXp, bn = nn;
            while (bx >= xpPourNiveau(bn)) { bx -= xpPourNiveau(bn); bn++; }
            setXp(bx); setNiveau(bn);
            setXpTotal(prev => prev + bonusXp);
            setXpAujourdhui(prev => prev + bonusXp);
            setTimeout(() => alert('🏆 Toutes les quêtes complétées ! Bonus XP !'), 300);
        }
    }

    function validerBonus(id) {
        const quete = toutesQuetes.find(q => q.id === id);
        if (!quete || bonusValides.includes(id)) return;
        const bonusXp = Math.max(1, Math.floor(quete.xp / DIVISEUR_XP_BONUS));
        if (!window.confirm(`Valider "${quete.titre}" pour +${bonusXp} XP ?`)) return;
        setXpTotal(prev => prev + bonusXp);
        setXpAujourdhui(prev => prev + bonusXp);
        setQuetesTotal(prev => prev + 1);
        let nx = xp + bonusXp, nn = niveau;
        while (nx >= xpPourNiveau(nn)) { nx -= xpPourNiveau(nn); nn++; if (nn > niveau) alert(`🎉 Niveau ${nn} !`); }
        setXp(nx); setNiveau(nn);
        if (quete.unique) { setToutesQuetes(prev => prev.filter(q => q.id !== id)); }
        else { setToutesQuetes(prev => prev.map(q => q.id === id ? { ...q, completions: (q.completions || 0) + 1 } : q)); }
        setBonusValides(prev => [...prev, id]);
    }

    function validerPerso(id) {
        const quete = toutesQuetes.find(q => q.id === id);
        if (!quete || quetesPersoFaites.includes(id)) return;
        const persoXp = Math.max(1, Math.floor(quete.xp / DIVISEUR_XP_PERSO));
        if (!window.confirm(`Valider "${quete.titre}" pour +${persoXp} XP ?`)) return;
        setXpTotal(prev => prev + persoXp);
        setXpAujourdhui(prev => prev + persoXp);
        setQuetesTotal(prev => prev + 1);
        let nx = xp + persoXp, nn = niveau;
        while (nx >= xpPourNiveau(nn)) { nx -= xpPourNiveau(nn); nn++; if (nn > niveau) alert(`🎉 Niveau ${nn} !`); }
        setXp(nx); setNiveau(nn);
        setQuetesPersoFaites(prev => [...prev, id]);
        setToutesQuetes(prev => prev.map(q => q.id === id ? { ...q, completions: (q.completions || 0) + 1 } : q));
    }

    function rerollerQuetes() {
        if (rerollUtilise) return;
        const dejeFaites = quetes.filter(q => q.fait);
        const pasFaites = quetes.filter(q => !q.fait);
        const disponibles = toutesQuetes.filter(q => !quetes.some(qj => qj.id === q.id) && !quetesPerso.includes(q.id));
        const nbRestant = pasFaites.length;
        let nouvelles = selectionnerQuotidiennes(disponibles, nbRestant);
        if (nouvelles.length < nbRestant) {
            const manquantes = nbRestant - nouvelles.length;
            const utilisees = new Set([...dejeFaites.map(q => q.id), ...nouvelles.map(q => q.id)]);
            const complement = pasFaites.filter(q => !utilisees.has(q.id)).sort(() => Math.random() - 0.5).slice(0, manquantes);
            nouvelles = [...nouvelles, ...complement];
        }
        setQuetes([...dejeFaites, ...nouvelles]);
        setRerollUtilise(true);
    }

    function resetProfil() {
        if (!window.confirm('Réinitialiser toute la progression ?')) return;
        localStorage.removeItem('dailyquest_save');
        setXp(0); setNiveau(1); setXpTotal(0); setXpAujourdhui(0);
        setToutesQuetes(QUETES_INITIALES);
        setCategories(CATEGORIES_INITIALES);
        setQuetes(selectionnerQuotidiennes(QUETES_INITIALES, nbQuetesPourNiveau(1)));
        setNextId(11); setNomJoueur('Héros du quotidien'); setAvatar('⚔️');
        setRerollUtilise(false); setQuetesTotal(0); setBonusValides([]);
        setQuetesPerso([]); setQuetesPersoFaites([]); setModalProfil(false);
    }

    const quetesTries = [...quetes].sort((a, b) => {
        if (tri === 'xp_asc') return a.xp - b.xp;
        if (tri === 'xp_desc') return b.xp - a.xp;
        const catMatch = categories.find(c => c.id === tri);
        if (catMatch) return a.cat === tri ? -1 : b.cat === tri ? 1 : 0;
        return a.id - b.id;
    });

    // ============ RENDER HOME ============
    function renderHome() {
        return (
            <div>
                {/* Carte profil */}
                <div style={{ ...s.card, backgroundColor: theme.card, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <button onClick={() => { setNomTemp(nomJoueur); setAvatarTemp(avatar); setCouleurAvatarTemp(couleurAvatar); setModalProfil(true); }}
                            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: couleurAvatar, border: 'none', fontSize: 24, cursor: 'pointer' }}>
                            {avatar}
                        </button>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 500, color: theme.texte }}>{nomJoueur}</div>
                            <div style={{ fontSize: 13, color: theme.texteSecondaire }}>Rang : {getRang(niveau)}</div>
                        </div>
                        <button onClick={() => { setNomTemp(nomJoueur); setAvatarTemp(avatar); setCouleurAvatarTemp(couleurAvatar); setModalProfil(true); }}
                            style={{ ...s.btn, backgroundColor: 'transparent', color: '#7F77DD', border: 'none' }}>
                            ✏️ Modifier
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: theme.texteSecondaire }}>{xp} XP</span>
                        <span style={{ fontSize: 12, color: theme.texteSecondaire }}>Prochain niveau : {xpRequis} XP</span>
                    </div>
                    <div style={{ ...s.xpBarre, backgroundColor: theme.bordureLegere }}>
                        <div style={{ ...s.xpRemplissage, width: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { val: niveau, label: 'Niveau', onClick: null },
                            { val: afficherTotalQuetes ? quetesTotal : faitesAujourdhui, label: afficherTotalQuetes ? 'Quêtes total' : "Quêtes aujourd'hui", onClick: () => setAfficherTotalQuetes(!afficherTotalQuetes) },
                            { val: afficherXpTotal ? xpTotal : xpAujourdhui, label: afficherXpTotal ? 'XP total' : "XP aujourd'hui", onClick: () => setAfficherXpTotal(!afficherXpTotal) },
                        ].map((stat, i) => (
                            <div key={i} onClick={stat.onClick}
                                style={{ flex: 1, backgroundColor: theme.statCard, borderRadius: 8, padding: 10, textAlign: 'center', cursor: stat.onClick ? 'pointer' : 'default' }}>
                                <div style={{ fontSize: 22, fontWeight: 500, color: theme.texte }}>{stat.val}</div>
                                <div style={{ fontSize: 11, color: theme.texteSecondaire, marginTop: 2 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Boutons reroll / tri */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={rerollerQuetes} disabled={rerollUtilise || quetes.every(q => q.fait)}
                        style={{
                            ...s.btn, backgroundColor: (rerollUtilise || quetes.every(q => q.fait)) ? theme.fondSecondaire : theme.card,
                            color: (rerollUtilise || quetes.every(q => q.fait)) ? '#ccc' : '#7F77DD',
                            border: `1px solid ${(rerollUtilise || quetes.every(q => q.fait)) ? theme.bordureLegere : theme.bordure}`
                        }}>
                        🎲 {rerollUtilise ? 'Reroll utilisé' : quetes.every(q => q.fait) ? 'Tout complété !' : 'Reroll'}
                    </button>
                    <button onClick={() => setTriVisible(!triVisible)}
                        style={{ ...s.btn, backgroundColor: theme.card, color: '#7F77DD', border: `1px solid ${theme.bordure}` }}>
                        🔽 Trier
                    </button>
                </div>

                {triVisible && (
                    <div style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                        {[{ label: '📅 Par défaut', val: 'defaut' }, { label: '⭐ XP croissant', val: 'xp_asc' }, { label: '💀 XP décroissant', val: 'xp_desc' },
                        ...categories.map(c => ({ label: `${c.emoji} ${c.nom}`, val: c.id }))
                        ].map(t => (
                            <div key={t.val} onClick={() => { setTri(t.val); setTriVisible(false); }}
                                style={{ padding: 10, borderRadius: 8, backgroundColor: tri === t.val ? theme.triItemActif : theme.triItem, marginBottom: 4, cursor: 'pointer' }}>
                                <span style={{ fontSize: 13, color: tri === t.val ? '#534AB7' : theme.texteSecondaire }}>{t.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quêtes journalières */}
                {quetesTries.map(q => {
                    const cat = getCat(q.cat);
                    return (
                        <div key={q.id} style={{ ...s.queteCard, backgroundColor: theme.card, opacity: q.fait ? 0.5 : 1 }}>
                            <div style={{ ...s.queteIcone, backgroundColor: cat.couleur }}>{cat.emoji}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 500, color: theme.texte, textDecoration: q.fait ? 'line-through' : 'none' }}>{q.titre}</span>
                                    {q.unique && <span style={{ fontSize: 10 }}>🔥</span>}
                                </div>
                                <div style={{ fontSize: 12, color: theme.texteSecondaire, marginTop: 2 }}>{q.desc}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 8, color: cat.couleurTexte, backgroundColor: cat.couleur, marginRight: 8 }}>
                                +{q.xp} XP
                            </span>
                            <button onClick={() => validerQuete(q.id)} disabled={q.fait}
                                style={{ ...s.checkBtn, backgroundColor: q.fait ? '#639922' : 'transparent', borderColor: q.fait ? '#639922' : theme.bordure }}>
                                <span style={{ color: q.fait ? 'white' : '#888' }}>{q.fait ? '✓' : '○'}</span>
                            </button>
                        </div>
                    );
                })}

                {/* Quêtes personnelles */}
                {nbSlotsPerso(niveau) > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
                            <span style={{ fontSize: 16, fontWeight: 500, color: theme.texte }}>⭐ Quêtes personnelles</span>
                            <button onClick={() => setPersoVisible(!persoVisible)}
                                style={{ ...s.btn, backgroundColor: theme.card, color: '#7F77DD', border: `1px solid ${theme.bordure}` }}>
                                {persoVisible ? '▲ Réduire' : '▼ Afficher'}
                            </button>
                        </div>
                        {persoVisible && (
                            <div style={{ ...s.card, backgroundColor: theme.card }}>
                                <div style={{ fontSize: 12, color: theme.texteSecondaire, marginBottom: 10 }}>
                                    {quetesPerso.length}/{nbSlotsPerso(niveau)} slots — XP réduit à 1/{DIVISEUR_XP_PERSO}
                                </div>
                                {Array.from({ length: nbSlotsPerso(niveau) }).map((_, i) => {
                                    const id = quetesPerso[i];
                                    const quete = id !== undefined ? toutesQuetes.find(q => q.id === id) : null;
                                    const faite = id !== undefined && quetesPersoFaites.includes(id);
                                    const cat = quete ? getCat(quete.cat) : null;
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            {quete ? (
                                                <div onClick={() => !faite && validerPerso(id)}
                                                    style={{
                                                        flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10,
                                                        backgroundColor: faite ? theme.fondSecondaire : cat.couleur, opacity: faite ? 0.5 : 1, cursor: faite ? 'default' : 'pointer'
                                                    }}>
                                                    <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 500, color: faite ? theme.texteSecondaire : cat.couleurTexte }}>{quete.titre}</div>
                                                        <div style={{ fontSize: 11, color: faite ? theme.texteSecondaire : cat.couleurTexte }}>+{Math.max(1, Math.floor(quete.xp / DIVISEUR_XP_PERSO))} XP</div>
                                                    </div>
                                                    {faite && <span style={{ fontSize: 12, color: '#639922' }}>✓</span>}
                                                </div>
                                            ) : (
                                                <div style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px dashed ${theme.bordure}`, textAlign: 'center' }}>
                                                    <span style={{ fontSize: 12, color: theme.texteSecondaire }}>Slot vide</span>
                                                </div>
                                            )}
                                            {!faite && (
                                                <button onClick={() => {
                                                    const disponibles = toutesQuetes.filter(q => !quetesPerso.includes(q.id) && !quetes.some(qj => qj.id === q.id) && !q.unique);
                                                    if (!disponibles.length) { alert('Aucune quête disponible.'); return; }
                                                    const choix = disponibles.slice(0, 8).map((q, idx) => `${idx + 1}. ${getCat(q.cat).emoji} ${q.titre} (+${Math.max(1, Math.floor(q.xp / DIVISEUR_XP_PERSO))} XP)`).join('\n');
                                                    const rep = window.prompt(`Choisir (numéro) :\n${choix}${quete ? '\n0. Vider ce slot' : ''}`);
                                                    if (rep === null) return;
                                                    if (rep === '0' && quete) { const n = [...quetesPerso]; n.splice(i, 1); setQuetesPerso(n); return; }
                                                    const idx = parseInt(rep) - 1;
                                                    if (idx >= 0 && idx < disponibles.length) { const n = [...quetesPerso]; n[i] = disponibles[idx].id; setQuetesPerso(n); }
                                                }}
                                                    style={{ padding: 8, backgroundColor: '#7F77DD', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', fontSize: 12 }}>
                                                    {quete ? '🔄' : '+'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Quêtes bonus */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
                    <span style={{ fontSize: 16, fontWeight: 500, color: theme.texte }}>⚡ Quêtes bonus</span>
                    <button onClick={() => setBonusVisible(!bonusVisible)}
                        style={{ ...s.btn, backgroundColor: theme.card, color: '#7F77DD', border: `1px solid ${theme.bordure}` }}>
                        {bonusVisible ? '▲ Réduire' : '▼ Afficher'}
                    </button>
                </div>
                {bonusVisible && (
                    <div style={{ ...s.card, backgroundColor: theme.card }}>
                        <div style={{ fontSize: 12, color: theme.texteSecondaire, marginBottom: 10 }}>
                            Récompense réduite à 1/{DIVISEUR_XP_BONUS} de l'XP.
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {toutesQuetes.filter(q => !quetes.some(qj => qj.id === q.id) && !quetesPerso.includes(q.id))
                                .sort((a, b) => { const cats = ['sante', 'mental', 'social', 'competence']; if (a.cat !== b.cat) return cats.indexOf(a.cat) - cats.indexOf(b.cat); if (a.xp !== b.xp) return a.xp - b.xp; return a.titre.localeCompare(b.titre); })
                                .map((q, idx) => {
                                    const cat = getCat(q.cat);
                                    const fait = bonusValides.includes(q.id);
                                    return (
                                        <div key={`bonus-${q.id}-${idx}`} onClick={() => validerBonus(q.id)}
                                            style={{
                                                backgroundColor: fait ? theme.fondSecondaire : cat.couleur, borderRadius: 10, padding: 10, width: 'calc(50% - 4px)',
                                                boxSizing: 'border-box', opacity: fait ? 0.5 : 1, cursor: 'pointer'
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                                                {q.unique && <span style={{ fontSize: 10 }}>🔥</span>}
                                            </div>
                                            <div style={{ fontSize: 12, fontWeight: 500, color: fait ? theme.texteSecondaire : cat.couleurTexte, marginTop: 4 }}>{q.titre}</div>
                                            <div style={{ fontSize: 11, color: fait ? theme.texteSecondaire : cat.couleurTexte }}>+{Math.max(1, Math.floor(q.xp / DIVISEUR_XP_BONUS))} XP</div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                <div style={{ height: 80 }} />
            </div>
        );
    }

    // ============ RENDER QUÊTES ============
    function renderQuetes() {
        return <QuestesScreen categories={categories} setCategories={setCategories} toutesQuetes={toutesQuetes} setToutesQuetes={setToutesQuetes} nextId={nextId} setNextId={setNextId} theme={theme} getCat={getCat} COULEURS_CATEGORIES={COULEURS_CATEGORIES} EMOJIS_CATEGORIES={EMOJIS_CATEGORIES} />;
    }

    // ============ MODAL PROFIL ============
    function renderModalProfil() {
        if (!modalProfil) return null;
        return (
            <div style={s.modal} onClick={e => e.target === e.currentTarget && setModalProfil(false)}>
                <div style={{ ...s.modalCard, backgroundColor: theme.card }}>
                    <div style={{ fontSize: 18, fontWeight: 500, textAlign: 'center', marginBottom: 16, color: theme.texte }}>Mon profil</div>

                    <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Nom du joueur</div>
                    <input style={{ ...s.input, backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte }}
                        value={nomTemp} onChange={e => setNomTemp(e.target.value)} placeholder="Votre nom..." />

                    <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Avatar</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                        {AVATARS.map(a => (
                            <button key={a} onClick={() => setAvatarTemp(a)}
                                style={{
                                    width: 56, height: 56, borderRadius: 28, border: avatarTemp === a ? '2px solid #7F77DD' : '1px solid #ccc',
                                    backgroundColor: theme.fondSecondaire, fontSize: 28, cursor: 'pointer'
                                }}>
                                {a}
                            </button>
                        ))}
                    </div>

                    <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Couleur de fond</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                        {COULEURS_AVATAR.map(c => (
                            <button key={c} onClick={() => setCouleurAvatarTemp(c)}
                                style={{
                                    width: 56, height: 56, borderRadius: 28, backgroundColor: c,
                                    border: couleurAvatarTemp === c ? '2px solid #7F77DD' : '1px solid #ccc', cursor: 'pointer'
                                }} />
                        ))}
                    </div>

                    <button onClick={() => setColorPickerVisible(!colorPickerVisible)}
                        style={{
                            ...s.btn, width: '100%', backgroundColor: theme.fondSecondaire, border: `1px solid ${theme.bordure}`,
                            color: theme.texteSecondaire, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8
                        }}>
                        <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: couleurAvatarTemp, border: '1px solid #ccc' }} />
                        Couleur personnalisée...
                    </button>

                    {colorPickerVisible && (
                        <div style={{ marginBottom: 10 }}>
                            {['R', 'G', 'B'].map((canal, i) => {
                                const vals = [parseInt(couleurAvatarTemp.slice(1, 3), 16) || 0, parseInt(couleurAvatarTemp.slice(3, 5), 16) || 0, parseInt(couleurAvatarTemp.slice(5, 7), 16) || 0];
                                const couleurs = ['#FF5555', '#55AA55', '#5555FF'];
                                return (
                                    <div key={canal} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, color: couleurs[i], fontWeight: 500 }}>{canal}</span>
                                            <span style={{ fontSize: 13, color: theme.texteSecondaire }}>{vals[i]}</span>
                                        </div>
                                        <div style={{ height: 6, backgroundColor: theme.bordureLegere, borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ height: 6, width: `${(vals[i] / 255) * 100}%`, backgroundColor: couleurs[i], borderRadius: 3 }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                            {[[-10, '−', 16], [-1, '-1', 12], [1, '+1', 12], [10, '+', 16]].map(([delta, label, size]) => (
                                                <button key={`${canal}-${label}`} onClick={() => {
                                                    const nv = [...vals]; nv[i] = Math.min(255, Math.max(0, nv[i] + delta));
                                                    setCouleurAvatarTemp(`#${nv.map(v => v.toString(16).padStart(2, '0')).join('')}`);
                                                }} style={{
                                                    padding: 6, backgroundColor: theme.fondSecondaire, borderRadius: 6, width: 36,
                                                    textAlign: 'center', border: 'none', fontSize: size, color: theme.texte, cursor: 'pointer'
                                                }}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button onClick={() => setDarkMode(prev => prev === null ? !prefersDark : !prev)}
                        style={{
                            ...s.btn, width: '100%', backgroundColor: theme.fondSecondaire, border: `1px solid ${theme.bordure}`,
                            color: theme.texte, marginBottom: 10, display: 'flex', justifyContent: 'space-between'
                        }}>
                        <span>{(darkMode === null ? prefersDark : darkMode) ? '🌙 Mode sombre' : '☀️ Mode clair'}</span>
                        <span style={{ color: theme.texteSecondaire }}>{darkMode === null ? 'Auto' : 'Manuel'}</span>
                    </button>

                    <button style={s.ajouterBtn} onClick={() => {
                        if (nomTemp.trim()) setNomJoueur(nomTemp.trim());
                        setAvatar(avatarTemp); setCouleurAvatar(couleurAvatarTemp); setModalProfil(false);
                    }}>Sauvegarder</button>

                    <button style={s.supprimerBtn} onClick={resetProfil}>🗑️ Réinitialiser la progression</button>

                    <button onClick={() => setModalProfil(false)}
                        style={{ ...s.btn, width: '100%', backgroundColor: 'transparent', border: 'none', color: theme.texteSecondaire, marginTop: 4 }}>
                        Annuler
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: couleurFond, minHeight: '100vh' }}>
            <div style={{ ...s.container, paddingBottom: 80 }}>
                {onglet === 'home' && renderHome()}
                {onglet === 'quetes' && renderQuetes()}
            </div>

            {/* Tab bar */}
            <div style={{ ...s.tabBar, backgroundColor: theme.card, borderColor: theme.bordureLegere }}>
                {[
                    { id: 'home', emoji: '🏠', label: 'Accueil' },
                    { id: 'quetes', emoji: '📋', label: 'Quêtes' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setOnglet(tab.id)}
                        style={{
                            ...s.tabBtn, backgroundColor: onglet === tab.id ? theme.triItemActif : theme.card,
                            color: onglet === tab.id ? '#7F77DD' : theme.texteSecondaire, border: 'none'
                        }}>
                        <span style={{ fontSize: 20 }}>{tab.emoji}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {renderModalProfil()}
        </div>
    );
}

// ============ ÉCRAN QUÊTES ============
function QuestesScreen({ categories, setCategories, toutesQuetes, setToutesQuetes, nextId, setNextId, theme, getCat, COULEURS_CATEGORIES, EMOJIS_CATEGORIES }) {
    const [filtre, setFiltre] = useState('tous');
    const [ajoutVisible, setAjoutVisible] = useState(false);
    const [catVisible, setCatVisible] = useState(false);
    const [newTitre, setNewTitre] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCat, setNewCat] = useState('sante');
    const [newDiff, setNewDiff] = useState(25);
    const [newUnique, setNewUnique] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [queteEdit, setQueteEdit] = useState(null);
    const [editTitre, setEditTitre] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editCat, setEditCat] = useState('sante');
    const [editXp, setEditXp] = useState(25);
    const [editUnique, setEditUnique] = useState(false);
    const [catEditVisible, setCatEditVisible] = useState(false);
    const [catEdit, setCatEdit] = useState(null);
    const [catEditNom, setCatEditNom] = useState('');
    const [catEditEmoji, setCatEditEmoji] = useState('📦');
    const [newCatNom, setNewCatNom] = useState('');
    const [newCatEmoji, setNewCatEmoji] = useState('📦');
    const [ajoutCatVisible, setAjoutCatVisible] = useState(false);

    async function sauvegarderQuetes(nouvelles) {
        try {
            const d = localStorage.getItem('dailyquest_save');
            if (d) { const s = JSON.parse(d); localStorage.setItem('dailyquest_save', JSON.stringify({ ...s, toutesQuetes: nouvelles })); }
        } catch (e) { }
        setToutesQuetes(nouvelles);
    }

    async function sauvegarderCategories(nouvelles) {
        try {
            const d = localStorage.getItem('dailyquest_save');
            if (d) { const s = JSON.parse(d); localStorage.setItem('dailyquest_save', JSON.stringify({ ...s, categories: nouvelles })); }
        } catch (e) { }
        setCategories(nouvelles);
    }

    function ajouterQuete() {
        if (!newTitre.trim()) return;
        const nouvelleQuete = { id: nextId, titre: newTitre.trim(), desc: newDesc.trim() || newCat, cat: newCat, xp: newDiff, fait: false, unique: newUnique };
        const nouvelles = [...toutesQuetes, nouvelleQuete];
        sauvegarderQuetes(nouvelles);
        try { const d = localStorage.getItem('dailyquest_save'); if (d) { const s = JSON.parse(d); localStorage.setItem('dailyquest_save', JSON.stringify({ ...s, nextId: nextId + 1 })); } } catch (e) { }
        setNextId(nextId + 1);
        setNewTitre(''); setNewDesc(''); setNewCat('sante'); setNewDiff(25); setNewUnique(false); setAjoutVisible(false);
    }

    function sauvegarderEdit() {
        if (!editTitre.trim() || !queteEdit) return;
        sauvegarderQuetes(toutesQuetes.map(q => q.id === queteEdit.id ? { ...q, titre: editTitre.trim(), desc: editDesc.trim() || q.cat, cat: editCat, xp: editXp, unique: editUnique } : q));
        setEditVisible(false);
    }

    function supprimerQuete(id) {
        if (!window.confirm('Supprimer cette quête ?')) return;
        sauvegarderQuetes(toutesQuetes.filter(q => q.id !== id));
        setEditVisible(false);
    }

    function ajouterCategorie() {
        if (!newCatNom.trim()) return;
        const id = `cat_${Date.now()}`;
        const idx = categories.length % COULEURS_CATEGORIES.length;
        sauvegarderCategories([...categories, { id, nom: newCatNom.trim(), emoji: newCatEmoji, couleur: COULEURS_CATEGORIES[idx].couleur, couleurTexte: COULEURS_CATEGORIES[idx].couleurTexte }]);
        setNewCatNom(''); setNewCatEmoji('📦'); setAjoutCatVisible(false);
    }

    function sauvegarderEditCat() {
        if (!catEditNom.trim() || !catEdit) return;
        sauvegarderCategories(categories.map(c => c.id === catEdit.id ? { ...c, nom: catEditNom.trim(), emoji: catEditEmoji } : c));
        setCatEditVisible(false);
    }

    function supprimerCategorie(id) {
        if (id === 'default') return;
        if (!window.confirm('Supprimer cette catégorie ? Les quêtes iront dans "Autre".')) return;
        sauvegarderCategories(categories.filter(c => c.id !== id));
        sauvegarderQuetes(toutesQuetes.map(q => q.cat === id ? { ...q, cat: 'default' } : q));
        setCatEditVisible(false);
    }

    const quetesFiltrees = filtre === 'tous' ? toutesQuetes : toutesQuetes.filter(q => q.cat === filtre);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: theme.texte }}>📋 Toutes les quêtes</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCatVisible(!catVisible)}
                        style={{ ...s.btn, backgroundColor: theme.card, color: '#7F77DD', border: `1px solid ${theme.bordure}` }}>
                        🏷️ Catégories
                    </button>
                    <button onClick={() => setAjoutVisible(!ajoutVisible)}
                        style={{ ...s.btn, backgroundColor: '#7F77DD', color: 'white', border: 'none' }}>
                        ➕ Ajouter
                    </button>
                </div>
            </div>

            {/* Gestion catégories */}
            {catVisible && (
                <div style={{ ...s.card, backgroundColor: theme.card, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 10 }}>Gérer les catégories</div>
                    {categories.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: c.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.emoji}</div>
                            <span style={{ flex: 1, fontSize: 14, color: theme.texte }}>{c.nom}</span>
                            <button onClick={() => { setCatEdit(c); setCatEditNom(c.nom); setCatEditEmoji(c.emoji); setCatEditVisible(true); }}
                                style={{ ...s.btn, backgroundColor: 'transparent', border: 'none', fontSize: 16 }}>✏️</button>
                            {c.id !== 'default' && <button onClick={() => supprimerCategorie(c.id)}
                                style={{ ...s.btn, backgroundColor: 'transparent', border: 'none', fontSize: 16 }}>🗑️</button>}
                        </div>
                    ))}
                    <button onClick={() => setAjoutCatVisible(!ajoutCatVisible)}
                        style={{ ...s.btn, width: '100%', backgroundColor: 'transparent', border: `1px solid #7F77DD`, color: '#7F77DD', marginTop: 6 }}>
                        ➕ Nouvelle catégorie
                    </button>
                    {ajoutCatVisible && (
                        <div style={{ marginTop: 10 }}>
                            <input style={{ ...s.input, backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte }}
                                value={newCatNom} onChange={e => setNewCatNom(e.target.value)} placeholder="Nom de la catégorie..." />
                            <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Emoji</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                {EMOJIS_CATEGORIES.map(e => (
                                    <button key={e} onClick={() => setNewCatEmoji(e)}
                                        style={{
                                            width: 40, height: 40, borderRadius: 8, border: newCatEmoji === e ? '1.5px solid #7F77DD' : 'none',
                                            backgroundColor: newCatEmoji === e ? '#EEEDFE' : theme.fondSecondaire, fontSize: 20, cursor: 'pointer'
                                        }}>
                                        {e}
                                    </button>
                                ))}
                            </div>
                            <button style={s.ajouterBtn} onClick={ajouterCategorie}>Ajouter</button>
                        </div>
                    )}
                </div>
            )}

            {/* Formulaire ajout quête */}
            {ajoutVisible && (
                <div style={{ ...s.card, backgroundColor: theme.card, marginBottom: 12 }}>
                    <input style={{ ...s.input, backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte }}
                        value={newTitre} onChange={e => setNewTitre(e.target.value)} placeholder="Nom de la quête..." />
                    <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical', backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte, fontFamily: 'inherit' }}
                        value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optionnel)..." />
                    <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Catégorie</div>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 10, paddingBottom: 4 }}>
                        {categories.map(c => (
                            <button key={c.id} onClick={() => setNewCat(c.id)}
                                style={{
                                    ...s.btn, flexShrink: 0, backgroundColor: newCat === c.id ? c.couleur : theme.fondSecondaire,
                                    color: newCat === c.id ? c.couleurTexte : theme.texteSecondaire, border: `1px solid ${theme.bordure}`
                                }}>
                                {c.emoji} {c.nom}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Difficulté</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {[{ label: '⭐\nFacile', xp: 10 }, { label: '⭐⭐\nIntermédiaire', xp: 15 }, { label: '⭐⭐⭐\nDifficile', xp: 25 }, { label: '💎\nExpert', xp: 50 }, { label: '💀\nLégendaire', xp: 100 }].map(d => (
                            <button key={d.xp} onClick={() => setNewDiff(d.xp)}
                                style={{
                                    flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ccc', backgroundColor: newDiff === d.xp ? '#EEEDFE' : theme.fondSecondaire,
                                    color: newDiff === d.xp ? '#534AB7' : theme.texteSecondaire, fontSize: 11, cursor: 'pointer', whiteSpace: 'pre-line'
                                }}>
                                {d.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setNewUnique(!newUnique)}
                        style={{
                            ...s.btn, width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                            borderColor: newUnique ? '#cc5500' : theme.bordure, backgroundColor: newUnique ? '#FFF3EC' : theme.fondSecondaire,
                            border: `1px solid ${newUnique ? '#cc5500' : theme.bordure}`
                        }}>
                        <span style={{ fontSize: 18 }}>{newUnique ? '🔥' : '○'}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: newUnique ? '#cc5500' : theme.texte }}>Quête unique</div>
                            <div style={{ fontSize: 11, color: theme.texteSecondaire }}>Supprimée après validation</div>
                        </div>
                    </button>
                    <button style={s.ajouterBtn} onClick={ajouterQuete}>Ajouter la quête</button>
                </div>
            )}

            {/* Filtres */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 12, paddingBottom: 4 }}>
                <button onClick={() => setFiltre('tous')}
                    style={{
                        ...s.btn, flexShrink: 0, backgroundColor: filtre === 'tous' ? '#EEEDFE' : theme.card,
                        color: filtre === 'tous' ? '#534AB7' : theme.texteSecondaire, border: `1px solid ${filtre === 'tous' ? '#7F77DD' : theme.bordure}`
                    }}>
                    🌐 Toutes
                </button>
                {categories.map(c => (
                    <button key={c.id} onClick={() => setFiltre(c.id)}
                        style={{
                            ...s.btn, flexShrink: 0, backgroundColor: filtre === c.id ? c.couleur : theme.card,
                            color: filtre === c.id ? c.couleurTexte : theme.texteSecondaire, border: `1px solid ${filtre === c.id ? c.couleurTexte : theme.bordure}`
                        }}>
                        {c.emoji} {c.nom}
                    </button>
                ))}
            </div>

            {/* Liste quêtes */}
            {quetesFiltrees.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: theme.texteSecondaire }}>Aucune quête dans cette catégorie</div>
            )}
            {quetesFiltrees.map(q => {
                const cat = getCat(q.cat);
                return (
                    <div key={q.id} style={{ ...s.queteCard, backgroundColor: theme.card, opacity: q.fait ? 0.5 : 1 }}>
                        <div style={{ ...s.queteIcone, backgroundColor: cat.couleur }}>{cat.emoji}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: theme.texte, textDecoration: q.fait ? 'line-through' : 'none' }}>{q.titre}</span>
                                {q.unique && <span style={{ fontSize: 10 }}>🔥</span>}
                            </div>
                            <div style={{ fontSize: 12, color: theme.texteSecondaire, marginTop: 2 }}>{q.desc}</div>
                            {(q.completions || 0) > 0 && <div style={{ fontSize: 11, color: '#7F77DD', marginTop: 3 }}>✓ Complétée {q.completions} fois</div>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 8, color: cat.couleurTexte, backgroundColor: cat.couleur, marginRight: 8 }}>+{q.xp} XP</span>
                        <button onClick={() => { setQueteEdit(q); setEditTitre(q.titre); setEditDesc(q.desc); setEditCat(q.cat); setEditXp(q.xp); setEditUnique(q.unique || false); setEditVisible(true); }}
                            style={{ ...s.btn, backgroundColor: 'transparent', border: 'none', fontSize: 16 }}>✏️</button>
                    </div>
                );
            })}

            {/* Modal édition quête */}
            {editVisible && (
                <div style={s.modal} onClick={e => e.target === e.currentTarget && setEditVisible(false)}>
                    <div style={{ ...s.modalCard, backgroundColor: theme.card }}>
                        <div style={{ fontSize: 18, fontWeight: 500, textAlign: 'center', marginBottom: 16, color: theme.texte }}>Modifier la quête</div>
                        <input style={{ ...s.input, backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte }}
                            value={editTitre} onChange={e => setEditTitre(e.target.value)} placeholder="Nom..." />
                        <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical', backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte, fontFamily: 'inherit' }}
                            value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description..." />
                        <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Catégorie</div>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 10, paddingBottom: 4 }}>
                            {categories.map(c => (
                                <button key={c.id} onClick={() => setEditCat(c.id)}
                                    style={{
                                        ...s.btn, flexShrink: 0, backgroundColor: editCat === c.id ? c.couleur : theme.fondSecondaire,
                                        color: editCat === c.id ? c.couleurTexte : theme.texteSecondaire, border: `1px solid ${theme.bordure}`
                                    }}>
                                    {c.emoji} {c.nom}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Difficulté</div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                            {[{ label: '⭐\nFacile', xp: 10 }, { label: '⭐⭐\nIntermédiaire', xp: 15 }, { label: '⭐⭐⭐\nDifficile', xp: 25 }, { label: '💎\nExpert', xp: 50 }, { label: '💀\nLégendaire', xp: 100 }].map(d => (
                                <button key={d.xp} onClick={() => setEditXp(d.xp)}
                                    style={{
                                        flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ccc', backgroundColor: editXp === d.xp ? '#EEEDFE' : theme.fondSecondaire,
                                        color: editXp === d.xp ? '#534AB7' : theme.texteSecondaire, fontSize: 11, cursor: 'pointer', whiteSpace: 'pre-line'
                                    }}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setEditUnique(!editUnique)}
                            style={{
                                ...s.btn, width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                                border: `1px solid ${editUnique ? '#cc5500' : theme.bordure}`, backgroundColor: editUnique ? '#FFF3EC' : theme.fondSecondaire
                            }}>
                            <span style={{ fontSize: 18 }}>{editUnique ? '🔥' : '○'}</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: editUnique ? '#cc5500' : theme.texte }}>Quête unique</div>
                                <div style={{ fontSize: 11, color: theme.texteSecondaire }}>Supprimée après validation</div>
                            </div>
                        </button>
                        <button style={s.ajouterBtn} onClick={sauvegarderEdit}>Sauvegarder</button>
                        <button style={s.supprimerBtn} onClick={() => queteEdit && supprimerQuete(queteEdit.id)}>🗑️ Supprimer la quête</button>
                        <button onClick={() => setEditVisible(false)}
                            style={{ ...s.btn, width: '100%', backgroundColor: 'transparent', border: 'none', color: theme.texteSecondaire, marginTop: 4 }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Modal édition catégorie */}
            {catEditVisible && (
                <div style={s.modal} onClick={e => e.target === e.currentTarget && setCatEditVisible(false)}>
                    <div style={{ ...s.modalCard, backgroundColor: theme.card }}>
                        <div style={{ fontSize: 18, fontWeight: 500, textAlign: 'center', marginBottom: 16, color: theme.texte }}>Modifier la catégorie</div>
                        <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Nom</div>
                        <input style={{ ...s.input, backgroundColor: theme.inputFond, borderColor: theme.bordure, color: theme.texte }}
                            value={catEditNom} onChange={e => setCatEditNom(e.target.value)} placeholder="Nom..." />
                        <div style={{ fontSize: 13, color: theme.texteSecondaire, marginBottom: 6 }}>Emoji</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {EMOJIS_CATEGORIES.map(e => (
                                <button key={e} onClick={() => setCatEditEmoji(e)}
                                    style={{
                                        width: 40, height: 40, borderRadius: 8, border: catEditEmoji === e ? '1.5px solid #7F77DD' : 'none',
                                        backgroundColor: catEditEmoji === e ? '#EEEDFE' : theme.fondSecondaire, fontSize: 20, cursor: 'pointer'
                                    }}>
                                    {e}
                                </button>
                            ))}
                        </div>
                        <button style={s.ajouterBtn} onClick={sauvegarderEditCat}>Sauvegarder</button>
                        {catEdit && catEdit.id !== 'default' && (
                            <button style={s.supprimerBtn} onClick={() => catEdit && supprimerCategorie(catEdit.id)}>🗑️ Supprimer la catégorie</button>
                        )}
                        <button onClick={() => setCatEditVisible(false)}
                            style={{ ...s.btn, width: '100%', backgroundColor: 'transparent', border: 'none', color: theme.texteSecondaire, marginTop: 4 }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            <div style={{ height: 80 }} />
        </div>
    );
}