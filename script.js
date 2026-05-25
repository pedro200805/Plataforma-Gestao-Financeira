const dadosSalvos = JSON.parse(sessionStorage.getItem('fincontrol_config'))
const transacoesSalvas = JSON.parse(sessionStorage.getItem('fincontrol_transacoes'))

const dados = dadosSalvos || {
    usuario: "",
    carteiras: {},
    metas: {},
    cartoes: []
}

if (!dados.cartoes) dados.cartoes = []

const transacoes = transacoesSalvas || []

// === CONFIGURACOES.HTML === //

function salvarDados() {
    sessionStorage.setItem('fincontrol_config', JSON.stringify(dados))
    sessionStorage.setItem('fincontrol_transacoes', JSON.stringify(transacoes))
}

const formConfig = document.getElementById('formConfig')
if (formConfig) {
    formConfig.addEventListener('submit', function(e) {
        e.preventDefault()
        dados.usuario = document.getElementById('inputUsuario').value
        const mes = document.getElementById('selectMesRef').value
        const meta = parseFloat(document.getElementById('inputMeta').value)
        const digital = parseFloat(document.getElementById('inputCarteiraDigital').value)
        const fisica = parseFloat(document.getElementById('inputCarteiraFisica').value)
        if (mes) {
            if (!isNaN(meta)) dados.metas[mes] = meta
            dados.carteiras[mes] = dados.carteiras[mes] || {}
            if (!isNaN(digital)) dados.carteiras[mes].digital = digital
            if (!isNaN(fisica)) dados.carteiras[mes].fisica = fisica
        }
        salvarDados()
        alert('Dados salvos com sucesso!')
    })
}

// === CARREGAR NOME NA SIDEBAR === //

function carregarNome() {
    const nameUser = document.getElementById('name_user')
    if (nameUser && dados.usuario) {
        nameUser.textContent = 'Olá, ' + dados.usuario.toUpperCase() + '👋'
    }
}

carregarNome()

// === SALVAR E RESTAURAR MÊS SELECIONADO === //

function salvarMesSelecionado(id, valor) {
    sessionStorage.setItem(id, valor)
}

function restaurarMesSelecionado(id) {
    const valor = sessionStorage.getItem(id)
    const select = document.getElementById(id)
    if (select && valor) select.value = valor
}

const selectMesHome = document.getElementById('select_mes_home')
if (selectMesHome) {
    restaurarMesSelecionado('select_mes_home')
    selectMesHome.addEventListener('change', function() {
        salvarMesSelecionado('select_mes_home', this.value)
        carregarHome()
    })
}

const selectMesRelatorio = document.getElementById('select_mes_relatorio')
if (selectMesRelatorio) {
    restaurarMesSelecionado('select_mes_relatorio')
    selectMesRelatorio.addEventListener('change', function() {
        salvarMesSelecionado('select_mes_relatorio', this.value)
        carregarRelatorios()
    })
}

const selectMesCarteira = document.getElementById('select_mes_carteira')
if (selectMesCarteira) {
    restaurarMesSelecionado('select_mes_carteira')
    selectMesCarteira.addEventListener('change', function() {
        salvarMesSelecionado('select_mes_carteira', this.value)
        carregarCarteira()
    })
}

// === CARREGAR DADOS NA HOME === //

function carregarHome() {
    const saldoAtual = document.getElementById('saldoAtual')
    if (!saldoAtual) return

    const selectMesHome = document.getElementById('select_mes_home')
    const mesSelecionado = selectMesHome ? selectMesHome.value : ''
    const transacoesFiltradas = mesSelecionado ? transacoes.filter(t => t.mes === mesSelecionado) : transacoes

    const totalReceitas = transacoesFiltradas.filter(t => t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0)
    const totalDespesas = transacoesFiltradas.filter(t => t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0)
    const carteiraMes = dados.carteiras && dados.carteiras[mesSelecionado] ? dados.carteiras[mesSelecionado] : { digital: 0, fisica: 0 }
    const saldo = (carteiraMes.digital + carteiraMes.fisica + totalReceitas) - totalDespesas

    document.getElementById('saldoAtual').textContent = 'R$ ' + saldo.toFixed(2)
    document.getElementById('receitas').textContent = '+ R$ ' + totalReceitas.toFixed(2)
    document.getElementById('despesas').textContent = '- R$ ' + totalDespesas.toFixed(2)

    const descricaoMeta = document.getElementById('descricaoMeta')
    const progresso = document.querySelector('.progresso')
    console.log('mesSelecionado:', mesSelecionado)
console.log('metas:', dados.metas)
console.log('meta do mês:', dados.metas[mesSelecionado])
console.log('progresso:', progresso)
    if (mesSelecionado && dados.metas && dados.metas[mesSelecionado]) {
        const meta = dados.metas[mesSelecionado]
        descricaoMeta.textContent = 'Meta de ' + mesSelecionado + ': Economizar R$ ' + meta.toFixed(2)
        const porcentagem = Math.min(saldo / meta * 100, 100)
        progresso.style.width = porcentagem + '%'
        progresso.style.transition = 'width 1s ease'
    } else {
        descricaoMeta.textContent = 'Nenhuma meta definida'
        progresso.style.width = '0%'
    }

    const tabelaTransacoes = document.getElementById('tabelaTransacoes')
    if (tabelaTransacoes) {
        tabelaTransacoes.innerHTML = ''
        transacoesFiltradas.slice(-5).reverse().forEach(t => {
            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td>${t.descricao}</td>
                <td>${t.categoria}</td>
                <td style="color: ${t.tipo === 'Receita' ? '#10b981' : '#ef4444'}">
                    ${t.tipo === 'Receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
                </td>
            `
            tabelaTransacoes.appendChild(tr)
        })
    }
}

const btnAdicionar = document.getElementById('btnAdicionar')
if (btnAdicionar) {
    btnAdicionar.addEventListener('click', function() {
        const descricao = document.getElementById('inputDescricao').value
        const valor = parseFloat(document.getElementById('inputValor').value)
        const tipo = document.getElementById('selectTipo').value
        const categoria = document.getElementById('selectCategoria').value
        const mes = document.getElementById('selectMes').value

        if (!descricao || !valor || !tipo || !categoria || !mes) {
            alert('Preencha todos os campos!')
            return
        }

        transacoes.push({ descricao, valor, tipo, categoria, mes })
        salvarDados()
        carregarTransacoes()

        document.getElementById('inputDescricao').value = ''
        document.getElementById('inputValor').value = ''
    })
}

// === CARREGAR TRANSAÇÕES === //

function carregarTransacoes() {
    const lista = document.getElementById('listaTransacoes')
    if (!lista) return

    lista.innerHTML = ''
    transacoes.slice().reverse().forEach(t => {
        const div = document.createElement('div')
        div.className = 'transacao-item ' + (t.tipo === 'Receita' ? 'receita-item' : 'despesa-item')
        div.innerHTML = `
            <div>
                <h3>${t.descricao}</h3>
                <p>${t.categoria} — ${t.mes}</p>
            </div>
            <span style="color: ${t.tipo === 'Receita' ? '#10b981' : '#ef4444'}">
                ${t.tipo === 'Receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
            </span>
        `
        lista.appendChild(div)
    })
}

carregarTransacoes()

// === CARREGAR CARTEIRA === //

function carregarCarteira() {
    const saldoDigital = document.getElementById('saldoDigital')
    const saldoFisico = document.getElementById('saldoFisico')
    if (!saldoDigital) return

    const selectMesCarteira = document.getElementById('select_mes_carteira')
    const mesSelecionado = selectMesCarteira ? selectMesCarteira.value : ''
    const carteiraMes = mesSelecionado && dados.carteiras && dados.carteiras[mesSelecionado] ? dados.carteiras[mesSelecionado] : { digital: 0, fisica: 0 }

    saldoDigital.textContent = 'R$ ' + (carteiraMes.digital || 0).toFixed(2)
    saldoFisico.textContent = 'R$ ' + (carteiraMes.fisica || 0).toFixed(2)
}

// === CARREGAR RELATÓRIOS === //

function carregarRelatorios() {
    const cardReceitas = document.getElementById('totalReceitas')
    if (!cardReceitas) return

    const selectMesRelatorio = document.getElementById('select_mes_relatorio')
    const mesSelecionado = selectMesRelatorio ? selectMesRelatorio.value : ''
    const transacoesFiltradas = mesSelecionado ? transacoes.filter(t => t.mes === mesSelecionado) : transacoes

    const somaReceitas = transacoesFiltradas.filter(t => t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0)
    const somaDespesas = transacoesFiltradas.filter(t => t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0)

    document.getElementById('totalReceitas').textContent = 'R$ ' + somaReceitas.toFixed(2)
    document.getElementById('totalDespesas').textContent = 'R$ ' + somaDespesas.toFixed(2)
    document.getElementById('saldoFinal').textContent = 'R$ ' + (somaReceitas - somaDespesas).toFixed(2)

    const meses = [...new Set(transacoes.map(t => t.mes))]
    const tbody = document.getElementById('tabelaRelatorio')
    tbody.innerHTML = ''

    meses.forEach(mes => {
        const rec = transacoes.filter(t => t.mes === mes && t.tipo === 'Receita').reduce((acc, t) => acc + t.valor, 0)
        const desp = transacoes.filter(t => t.mes === mes && t.tipo === 'Despesa').reduce((acc, t) => acc + t.valor, 0)
        const meta = dados.metas && dados.metas[mes] ? 'R$ ' + dados.metas[mes].toFixed(2) : '-'
        const tr = document.createElement('tr')
        tr.innerHTML = `
            <td>${mes}</td>
            <td style="color:#10b981">R$ ${rec.toFixed(2)}</td>
            <td style="color:#ef4444">R$ ${desp.toFixed(2)}</td>
            <td>R$ ${(rec - desp).toFixed(2)}</td>
            <td>${meta}</td>
        `
        tbody.appendChild(tr)
    })
}

// === CHAMANDO FUNÇÕES DE RESTAURAÇÃO E CARREGAMENTO === //

restaurarMesSelecionado('select_mes_home')
carregarHome()

restaurarMesSelecionado('select_mes_carteira')
carregarCarteira()

restaurarMesSelecionado('select_mes_relatorio')
carregarRelatorios()

// === FORMULARIO ADICIONAR CARTÕES === //

const formCartao = document.getElementById('formCartao')
if (formCartao) {
    formCartao.addEventListener('submit', function(e) {
        e.preventDefault()
        const apelido = document.getElementById('inputApelido').value
        const nome = document.getElementById('inputNomeCartao').value.toUpperCase()
        const numero = document.getElementById('inputNumero').value
        const cvv = document.getElementById('inputCVV').value
        const vencimento = document.getElementById('inputVencimento').value
        const limite = parseFloat(document.getElementById('inputLimite').value)
        dados.cartoes.push({ apelido, nome, numero, cvv, vencimento, limite })
        salvarDados()
        window.location.href = 'Carteira.html'
    })
}

// === CARREGAR CARTÕES NA HOME === //

function carregarCartoes() {
    const lista = document.getElementById('listaCartoes')
    if (!lista) return
    lista.innerHTML = ''
    if (!dados.cartoes || dados.cartoes.length === 0) return
    dados.cartoes.forEach((c, index) => {
        const div = document.createElement('div')
        div.className = 'cartao roxo'
        div.innerHTML = `
            <button class="btn-apagar-cartao" title="Apagar cartão" onclick="apagarCartao(${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
            <span>${c.apelido}</span>
            <h2>•••• ${String(c.numero).slice(-4)}</h2>
            <p>Limite: R$ ${c.limite.toFixed(2)}</p>
        `
        lista.appendChild(div)
    })
}

// === BOTAO DE APAGAR CARTÃO === //

function apagarCartao(index) {
    dados.cartoes.splice(index, 1)
    salvarDados()
    carregarCartoes()
}

// === CHAMANDO FUNÇÃO DE CARREGAR CARTÕES NA HOME === //

carregarCartoes()