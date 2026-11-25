import React, { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./supabase";

// ==================== CONFIGURAÇÕES RÁPIDAS ====================
const NOME_DO_EVENTO = "FESTIVAL NOITE DOURADA 2026";
const SUBTITULO_EVENTO = "CELEBRAÇÃO DE ANO NOVO, MÚSICA AO VIVO E BRINDE DA VIRADA";
// ===============================================================

type Lote = {
  id: number;
  nome: string;
  preco: number;
  quantidade_inicial: number;
  quantidade_disponivel: number;
};

type TelaAtiva = "comprador" | "login" | "cadastro_admin" | "admin";

type Aviso = {
  tipo: "sucesso" | "erro";
  texto: string;
} | null;

function maiuscula(valor: string | number | null | undefined): string {
  return String(valor ?? "").toUpperCase();
}

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>("comprador");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [totalArrecadado, setTotalArrecadado] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [salvandoLote, setSalvandoLote] = useState<boolean>(false);
  const [processandoCompra, setProcessandoCompra] = useState<boolean>(false);
  const [processandoVendaAdmin, setProcessandoVendaAdmin] = useState<boolean>(false);
  const [autenticando, setAutenticando] = useState<boolean>(false);
  const [cadastrandoAdmin, setCadastrandoAdmin] = useState<boolean>(false);
  const [adminLogado, setAdminLogado] = useState<string>("");
  const [aviso, setAviso] = useState<Aviso>(null);

  // Estados da Tela de Login
  const [usuarioLogin, setUsuarioLogin] = useState<string>("");
  const [senhaLogin, setSenhaLogin] = useState<string>("");

  // Estados da Tela de Cadastro de Admin
  const [novoUsuarioAdmin, setNovoUsuarioAdmin] = useState<string>("");
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState<string>("");
  const [confirmarSenhaAdmin, setConfirmarSenhaAdmin] = useState<string>("");

  // Estados do Painel do Comprador
  const [loteCompraId, setLoteCompraId] = useState<number | null>(null);
  const [qtdCompra, setQtdCompra] = useState<string>("1");

  // Estados do Painel Administrativo - Cadastro de Lote
  const [nomeLote, setNomeLote] = useState<string>("");
  const [precoLote, setPrecoLote] = useState<string>("");
  const [qtdLote, setQtdLote] = useState<string>("");

  // Estados do Painel Administrativo - Venda Manual
  const [loteVendaAdminId, setLoteVendaAdminId] = useState<number | null>(null);
  const [qtdVendaAdmin, setQtdVendaAdmin] = useState<string>("");

  function mostrarAviso(tipo: "sucesso" | "erro", texto: string) {
    setAviso({ tipo, texto: maiuscula(texto) });
  }

  function trocarTela(destino: TelaAtiva) {
    setAviso(null);
    setTelaAtiva(destino);
  }

  async function handleLoginAdmin() {
    setAviso(null);
    const usuarioDigitado = usuarioLogin.trim().toLowerCase();

    if (!usuarioDigitado || !senhaLogin) {
      mostrarAviso("erro", "PREENCHA USUÁRIO E SENHA.");
      return;
    }

    setAutenticando(true);
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, usuario, senha")
        .ilike("usuario", usuarioDigitado)
        .limit(1);

      if (error) throw error;

      const adminEncontrado = data && data[0];

      if (adminEncontrado && adminEncontrado.senha === senhaLogin) {
        setAdminLogado(maiuscula(adminEncontrado.usuario));
        setUsuarioLogin("");
        setSenhaLogin("");
        setTelaAtiva("admin");
        mostrarAviso("sucesso", `BEM-VINDO(A), ${maiuscula(adminEncontrado.usuario)}!`);
      } else {
        mostrarAviso("erro", "USUÁRIO OU SENHA INCORRETOS. TENTE NOVAMENTE.");
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      mostrarAviso(
        "erro",
        `ERRO AO VALIDAR LOGIN: ${maiuscula(error?.message ?? "VERIFIQUE A TABELA ADMINS NO SUPABASE.")}`
      );
    } finally {
      setAutenticando(false);
    }
  }

  async function handleCadastrarAdmin() {
    setAviso(null);
    const usuarioLimpo = novoUsuarioAdmin.trim().toLowerCase();

    if (!usuarioLimpo || !novaSenhaAdmin || !confirmarSenhaAdmin) {
      mostrarAviso("erro", "PREENCHA USUÁRIO, SENHA E CONFIRMAÇÃO DE SENHA.");
      return;
    }

    if (novaSenhaAdmin.length < 4) {
      mostrarAviso("erro", "A SENHA DEVE TER PELO MENOS 4 CARACTERES.");
      return;
    }

    if (novaSenhaAdmin !== confirmarSenhaAdmin) {
      mostrarAviso("erro", "A SENHA E A CONFIRMAÇÃO DE SENHA NÃO COINCIDEM.");
      return;
    }

    setCadastrandoAdmin(true);
    try {
      const { data: existentes, error: erroBusca } = await supabase
        .from("admins")
        .select("id")
        .ilike("usuario", usuarioLimpo)
        .limit(1);

      if (erroBusca) throw erroBusca;

      if (existentes && existentes.length > 0) {
        mostrarAviso("erro", `O USUÁRIO "${maiuscula(usuarioLimpo)}" JÁ ESTÁ CADASTRADO.`);
        return;
      }

      const { error: erroInsert } = await supabase
        .from("admins")
        .insert([{ usuario: usuarioLimpo, senha: novaSenhaAdmin }]);

      if (erroInsert) throw erroInsert;

      setNovoUsuarioAdmin("");
      setNovaSenhaAdmin("");
      setConfirmarSenhaAdmin("");
      setTelaAtiva("login");
      mostrarAviso(
        "sucesso",
        `ADMINISTRADOR "${maiuscula(usuarioLimpo)}" SALVO NO SUPABASE! FAÇA LOGIN PARA ENTRAR.`
      );
    } catch (error: any) {
      console.error("Erro ao cadastrar admin:", error);
      mostrarAviso(
        "erro",
        `ERRO AO CADASTRAR ADMIN: ${maiuscula(error?.message ?? "VERIFIQUE A TABELA ADMINS NO SUPABASE.")}`
      );
    } finally {
      setCadastrandoAdmin(false);
    }
  }

  function handleLogoutAdmin() {
    setAviso(null);
    setAdminLogado("");
    setTelaAtiva("comprador");
  }

  async function carregarDados() {
    setCarregando(true);
    try {
      const { data: dadosLotes, error: erroLotes } = await supabase
        .from("lotes")
        .select("*")
        .order("id", { ascending: true });

      if (erroLotes) throw erroLotes;

      const listaLotes: Lote[] = dadosLotes ?? [];
      setLotes(listaLotes);

      const lotesComEstoque = listaLotes.filter((l) => l.quantidade_disponivel > 0);

      if (lotesComEstoque.length > 0) {
        const compraAindaValida = lotesComEstoque.some((l) => l.id === loteCompraId);
        if (!compraAindaValida) {
          setLoteCompraId(lotesComEstoque[0].id);
        }
      } else {
        setLoteCompraId(null);
      }

      if (listaLotes.length > 0) {
        const vendaAdminAindaValida = listaLotes.some((l) => l.id === loteVendaAdminId);
        if (!vendaAdminAindaValida) {
          setLoteVendaAdminId(listaLotes[0].id);
        }
      } else {
        setLoteVendaAdminId(null);
      }

      const { data: dadosVendas, error: erroVendas } = await supabase
        .from("vendas")
        .select("valor_total");

      if (erroVendas) throw erroVendas;

      const somaVendas = (dadosVendas ?? []).reduce(
        (acc, item) => acc + Number(item.valor_total || 0),
        0
      );
      setTotalArrecadado(somaVendas);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      mostrarAviso(
        "erro",
        `FALHA AO SINCRONIZAR COM O SUPABASE: ${maiuscula(error?.message ?? "TENTE NOVAMENTE.")}`
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const saldoParado = lotes.reduce(
    (acc, lote) => acc + Number(lote.quantidade_disponivel) * Number(lote.preco),
    0
  );

  async function registrarVendaNoBanco(
    lote: Lote,
    quantidade: number,
    origem: "comprador" | "admin"
  ) {
    if (isNaN(quantidade) || quantidade <= 0) {
      mostrarAviso("erro", "INFORME UMA QUANTIDADE MAIOR QUE ZERO.");
      return false;
    }

    if (quantidade > lote.quantidade_disponivel) {
      mostrarAviso(
        "erro",
        `ESTOQUE INSUFICIENTE: RESTAM APENAS ${lote.quantidade_disponivel} INGRESSO(S) EM "${maiuscula(lote.nome)}".`
      );
      return false;
    }

    const valorTotalVenda = quantidade * Number(lote.preco);
    const novaQuantidadeDisponivel = lote.quantidade_disponivel - quantidade;

    const { error: erroVenda } = await supabase.from("vendas").insert([
      {
        lote_id: lote.id,
        quantidade_vendida: quantidade,
        valor_total: valorTotalVenda,
      },
    ]);

    if (erroVenda) throw erroVenda;

    const { error: erroAtualizaLote } = await supabase
      .from("lotes")
      .update({ quantidade_disponivel: novaQuantidadeDisponivel })
      .eq("id", lote.id);

    if (erroAtualizaLote) throw erroAtualizaLote;

    await carregarDados();

    if (origem === "comprador") {
      mostrarAviso(
        "sucesso",
        `COMPRA CONCLUÍDA! ${quantidade}X ${maiuscula(lote.nome)} — TOTAL: R$ ${valorTotalVenda.toFixed(2)}.`
      );
    } else {
      mostrarAviso(
        "sucesso",
        `VENDA LANÇADA NO ADMIN: ${quantidade}X ${maiuscula(lote.nome)} (R$ ${valorTotalVenda.toFixed(2)}).`
      );
    }

    return true;
  }

  async function handleComprarIngresso() {
    setAviso(null);
    const loteEscolhido = lotes.find((l) => l.id === loteCompraId);
    const quantidade = parseInt(qtdCompra, 10);

    if (!loteEscolhido) {
      mostrarAviso("erro", "SELECIONE UM LOTE DISPONÍVEL PARA COMPRAR.");
      return;
    }

    setProcessandoCompra(true);
    try {
      const ok = await registrarVendaNoBanco(loteEscolhido, quantidade, "comprador");
      if (ok) {
        setQtdCompra("1");
      }
    } catch (error: any) {
      console.error("Erro na compra:", error);
      mostrarAviso(
        "erro",
        `ERRO AO CONCLUIR COMPRA: ${maiuscula(error?.message ?? "TENTE NOVAMENTE.")}`
      );
    } finally {
      setProcessandoCompra(false);
    }
  }

  async function handleCadastrarLote() {
    setAviso(null);
    const precoNumerico = Number(precoLote.replace(",", "."));
    const qtdNumerica = parseInt(qtdLote, 10);

    if (
      !nomeLote.trim() ||
      isNaN(precoNumerico) ||
      precoNumerico <= 0 ||
      isNaN(qtdNumerica) ||
      qtdNumerica <= 0
    ) {
      mostrarAviso(
        "erro",
        "PREENCHA NOME, PREÇO MAIOR QUE ZERO E QUANTIDADE INTEIRA MAIOR QUE ZERO."
      );
      return;
    }

    setSalvandoLote(true);
    try {
      const nomeFormatado = maiuscula(nomeLote.trim());
      const { data, error } = await supabase
        .from("lotes")
        .insert([
          {
            nome: nomeFormatado,
            preco: precoNumerico,
            quantidade_inicial: qtdNumerica,
            quantidade_disponivel: qtdNumerica,
          },
        ])
        .select();

      if (error) throw error;

      setNomeLote("");
      setPrecoLote("");
      setQtdLote("");
      await carregarDados();

      if (data && data[0]?.id) {
        setLoteCompraId(data[0].id);
        setLoteVendaAdminId(data[0].id);
      }

      mostrarAviso(
        "sucesso",
        `LOTE "${maiuscula(data?.[0]?.nome ?? nomeFormatado)}" CADASTRADO COM SUCESSO!`
      );
    } catch (error: any) {
      console.error("Erro ao cadastrar lote:", error);
      mostrarAviso(
        "erro",
        `ERRO AO SALVAR LOTE: ${maiuscula(error?.message ?? "TENTE NOVAMENTE.")}`
      );
    } finally {
      setSalvandoLote(false);
    }
  }

  async function handleVendaAdmin() {
    setAviso(null);
    const loteEscolhido = lotes.find((l) => l.id === loteVendaAdminId);
    const quantidade = parseInt(qtdVendaAdmin, 10);

    if (!loteEscolhido) {
      mostrarAviso("erro", "SELECIONE UM LOTE PARA LANÇAR A VENDA.");
      return;
    }

    setProcessandoVendaAdmin(true);
    try {
      const ok = await registrarVendaNoBanco(loteEscolhido, quantidade, "admin");
      if (ok) {
        setQtdVendaAdmin("");
      }
    } catch (error: any) {
      console.error("Erro na venda admin:", error);
      mostrarAviso(
        "erro",
        `ERRO AO LANÇAR VENDA: ${maiuscula(error?.message ?? "TENTE NOVAMENTE.")}`
      );
    } finally {
      setProcessandoVendaAdmin(false);
    }
  }

  const loteAtivoCompra = lotes.find((l) => l.id === loteCompraId) ?? null;
  const qtdCompraNum = parseInt(qtdCompra, 10);
  const previaTotalCompra =
    loteAtivoCompra && !isNaN(qtdCompraNum) && qtdCompraNum > 0
      ? qtdCompraNum * Number(loteAtivoCompra.preco)
      : 0;

  if (telaAtiva === "login") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollCentralizado}>
          <View style={styles.cardAuth}>
            <Text style={styles.badgeDourado}>
              {maiuscula("ANO NOVO · ACESSO RESTRITO")}
            </Text>
            <Text style={styles.tituloAuth}>{maiuscula("ENTRAR NO PAINEL")}</Text>
            <Text style={styles.subtituloAuth}>{maiuscula(NOME_DO_EVENTO)}</Text>

            {aviso && (
              <View
                style={[
                  styles.avisoBox,
                  aviso.tipo === "sucesso" ? styles.avisoSucesso : styles.avisoErro,
                ]}
              >
                <Text
                  style={[
                    styles.avisoTexto,
                    aviso.tipo === "sucesso"
                      ? styles.avisoTextoSucesso
                      : styles.avisoTextoErro,
                  ]}
                >
                  {maiuscula(aviso.texto)}
                </Text>
              </View>
            )}

            <Text style={styles.labelCampo}>{maiuscula("USUÁRIO")}</Text>
            <TextInput
              style={styles.input}
              placeholder={maiuscula("DIGITE O USUÁRIO")}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              value={usuarioLogin}
              onChangeText={setUsuarioLogin}
            />

            <Text style={styles.labelCampo}>{maiuscula("SENHA")}</Text>
            <TextInput
              style={styles.input}
              placeholder={maiuscula("DIGITE A SENHA")}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={senhaLogin}
              onChangeText={setSenhaLogin}
              onSubmitEditing={handleLoginAdmin}
            />

            <TouchableOpacity
              style={[styles.botaoDourado, autenticando && styles.botaoDesabilitado]}
              onPress={handleLoginAdmin}
              disabled={autenticando}
            >
              <Text style={styles.textoBotao}>
                {autenticando
                  ? maiuscula("VERIFICANDO...")
                  : maiuscula("ENTRAR NO PAINEL")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoRose}
              onPress={() => trocarTela("cadastro_admin")}
            >
              <Text style={styles.textoBotao}>
                {maiuscula("CADASTRAR NOVO ADMIN")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => trocarTela("comprador")}
            >
              <Text style={styles.textoBotaoSecundario}>
                {maiuscula("← VOLTAR PARA A BILHETERIA")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (telaAtiva === "cadastro_admin") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollCentralizado}>
          <View style={styles.cardAuth}>
            <Text style={styles.badgeRose}>
              {maiuscula("NOVO ADMINISTRADOR")}
            </Text>
            <Text style={styles.tituloAuth}>
              {maiuscula("CADASTRO DE ADMIN")}
            </Text>
            <Text style={styles.subtituloAuth}>{maiuscula(NOME_DO_EVENTO)}</Text>

            {aviso && (
              <View style={[styles.avisoBox, styles.avisoErro]}>
                <Text style={[styles.avisoTexto, styles.avisoTextoErro]}>
                  {maiuscula(aviso.texto)}
                </Text>
              </View>
            )}

            <Text style={styles.labelCampo}>{maiuscula("NOME DE USUÁRIO")}</Text>
            <TextInput
              style={styles.input}
              placeholder={maiuscula("EX.: BRIGIDA_ADMIN")}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              value={novoUsuarioAdmin}
              onChangeText={setNovoUsuarioAdmin}
            />

            <Text style={styles.labelCampo}>
              {maiuscula("SENHA (MÍN. 4 CARACTERES)")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={maiuscula("CRIE UMA SENHA")}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={novaSenhaAdmin}
              onChangeText={setNovaSenhaAdmin}
            />

            <Text style={styles.labelCampo}>{maiuscula("CONFIRMAR SENHA")}</Text>
            <TextInput
              style={styles.input}
              placeholder={maiuscula("REPITA A SENHA")}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={confirmarSenhaAdmin}
              onChangeText={setConfirmarSenhaAdmin}
              onSubmitEditing={handleCadastrarAdmin}
            />

            <TouchableOpacity
              style={[
                styles.botaoDourado,
                cadastrandoAdmin && styles.botaoDesabilitado,
              ]}
              onPress={handleCadastrarAdmin}
              disabled={cadastrandoAdmin}
            >
              <Text style={styles.textoBotao}>
                {cadastrandoAdmin
                  ? maiuscula("SALVANDO...")
                  : maiuscula("SALVAR CADASTRO DE ADMIN")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => trocarTela("login")}
            >
              <Text style={styles.textoBotaoSecundario}>
                {maiuscula("← JÁ TENHO CONTA, IR PARA LOGIN")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.conteudoCentral}>
          <View style={styles.header}>
            <View style={styles.headerLinha}>
              <View style={styles.headerTextoColuna}>
                <Text
                  style={
                    telaAtiva === "admin" ? styles.badgeRose : styles.badgeDourado
                  }
                >
                  {telaAtiva === "admin"
                    ? maiuscula(`ADMIN LOGADO: ${adminLogado}`)
                    : maiuscula("ANO NOVO · BILHETERIA OFICIAL")}
                </Text>
                <Text style={styles.titulo}>{maiuscula(NOME_DO_EVENTO)}</Text>
                <Text style={styles.subtitulo}>
                  {telaAtiva === "admin"
                    ? maiuscula("GESTÃO DE LOTES, VENDAS E SALDOS EM TEMPO REAL")
                    : maiuscula(SUBTITULO_EVENTO)}
                </Text>
              </View>

              {telaAtiva === "comprador" ? (
                <TouchableOpacity
                  style={styles.botaoLateralAdmin}
                  onPress={() => trocarTela("login")}
                >
                  <Text style={styles.textoBotao}>
                    {maiuscula("ÁREA ADMIN")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.botaoLateralSair}
                  onPress={handleLogoutAdmin}
                >
                  <Text style={styles.textoBotaoLateralSair}>
                    {maiuscula("SAIR")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {aviso && (
            <View
              style={[
                styles.avisoBox,
                aviso.tipo === "sucesso" ? styles.avisoSucesso : styles.avisoErro,
              ]}
            >
              <Text
                style={[
                  styles.avisoTexto,
                  aviso.tipo === "sucesso"
                    ? styles.avisoTextoSucesso
                    : styles.avisoTextoErro,
                ]}
              >
                {maiuscula(aviso.texto)}
              </Text>
            </View>
          )}

          {telaAtiva === "comprador" && (
            <>
              <View style={styles.secao}>
                <Text style={styles.tituloSecao}>
                  {maiuscula("1. GARANTA SEU INGRESSO")}
                </Text>
                {carregando ? (
                  <Text style={styles.textoVazio}>
                    {maiuscula("CARREGANDO LOTES DISPONÍVEIS...")}
                  </Text>
                ) : lotes.length === 0 ? (
                  <Text style={styles.textoVazio}>
                    {maiuscula("NENHUM LOTE DISPONÍVEL NO MOMENTO.")}
                  </Text>
                ) : (
                  <>
                    <View style={styles.chipsContainer}>
                      {lotes.map((lote) => {
                        const esgotado = lote.quantidade_disponivel <= 0;
                        const selecionado = lote.id === loteCompraId && !esgotado;

                        return (
                          <TouchableOpacity
                            key={lote.id}
                            disabled={esgotado}
                            style={[
                              styles.chip,
                              selecionado && styles.chipSelecionadoDourado,
                              esgotado && styles.chipEsgotado,
                            ]}
                            onPress={() => setLoteCompraId(lote.id)}
                          >
                            <Text
                              style={[
                                styles.textoChip,
                                selecionado && styles.textoChipSelecionado,
                                esgotado && styles.textoChipEsgotado,
                              ]}
                            >
                              {maiuscula(
                                `${lote.nome} · R$ ${Number(lote.preco).toFixed(2)} · ${
                                  esgotado
                                    ? "ESGOTADO"
                                    : `${lote.quantidade_disponivel} RESTANTES`
                                }`
                              )}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.labelCampo}>
                      {maiuscula("QUANTIDADE DE INGRESSOS")}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={maiuscula("EX.: 2")}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={qtdCompra}
                      onChangeText={setQtdCompra}
                    />

                    <View style={styles.boxPrevia}>
                      <Text style={styles.labelPrevia}>
                        {maiuscula("TOTAL DA COMPRA")}
                      </Text>
                      <Text style={styles.valorPrevia}>
                        R$ {previaTotalCompra.toFixed(2)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.botaoDourado,
                        processandoCompra && styles.botaoDesabilitado,
                      ]}
                      onPress={handleComprarIngresso}
                      disabled={processandoCompra}
                    >
                      <Text style={styles.textoBotao}>
                        {processandoCompra
                          ? maiuscula("FINALIZANDO COMPRA...")
                          : maiuscula("FINALIZAR COMPRA")}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.secao}>
                <Text style={styles.tituloSecao}>
                  {maiuscula("2. LOTES DISPONÍVEIS")}
                </Text>
                {lotes.length === 0 ? (
                  <Text style={styles.textoVazio}>
                    {maiuscula("NENHUM LOTE CADASTRADO AINDA.")}
                  </Text>
                ) : (
                  lotes.map((lote) => (
                    <View key={lote.id} style={styles.itemLote}>
                      <View style={styles.itemTopo}>
                        <Text style={styles.nomeItem}>
                          {maiuscula(lote.nome)}
                        </Text>
                        <Text style={styles.precoBadge}>
                          R$ {Number(lote.preco).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.detalheItem}>
                        {maiuscula(
                          lote.quantidade_disponivel > 0
                            ? `DISPONÍVEIS PARA COMPRA: ${lote.quantidade_disponivel} INGRESSOS`
                            : "LOTE ESGOTADO"
                        )}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {telaAtiva === "admin" && (
            <>
              <View style={styles.resumoLinha}>
                <View style={[styles.cardResumo, styles.cardArrecadado]}>
                  <Text style={styles.labelArrecadado}>
                    {maiuscula("TOTAL ARRECADADO")}
                  </Text>
                  <Text style={styles.valorResumo}>
                    R$ {totalArrecadado.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.cardResumo, styles.cardParado]}>
                  <Text style={styles.labelParado}>
                    {maiuscula("SALDO FINANCEIRO PARADO")}
                  </Text>
                  <Text style={styles.valorResumo}>
                    R$ {saldoParado.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.secao}>
                <Text style={styles.tituloSecao}>
                  {maiuscula("CADASTRAR NOVO LOTE / TIPO")}
                </Text>
                <Text style={styles.labelCampo}>{maiuscula("NOME DO LOTE")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={maiuscula("EX.: 1º LOTE PISTA VIP")}
                  placeholderTextColor="#9CA3AF"
                  value={nomeLote}
                  onChangeText={setNomeLote}
                />

                <View style={styles.linhaInputs}>
                  <View style={styles.metade}>
                    <Text style={styles.labelCampo}>
                      {maiuscula("PREÇO UNITÁRIO (R$)")}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={maiuscula("EX.: 50.00")}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={precoLote}
                      onChangeText={setPrecoLote}
                    />
                  </View>

                  <View style={styles.metade}>
                    <Text style={styles.labelCampo}>
                      {maiuscula("QUANTIDADE INICIAL")}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={maiuscula("EX.: 100")}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={qtdLote}
                      onChangeText={setQtdLote}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.botaoDourado,
                    salvandoLote && styles.botaoDesabilitado,
                  ]}
                  onPress={handleCadastrarLote}
                  disabled={salvandoLote}
                >
                  <Text style={styles.textoBotao}>
                    {salvandoLote
                      ? maiuscula("SALVANDO LOTE...")
                      : maiuscula("SALVAR LOTE")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.secao}>
                <Text style={styles.tituloSecao}>
                  {maiuscula("LANÇAR VENDA (ADMIN)")}
                </Text>
                {lotes.length === 0 ? (
                  <Text style={styles.textoVazio}>
                    {maiuscula("CADASTRE UM LOTE ACIMA PARA LANÇAR VENDAS.")}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.labelCampo}>
                      {maiuscula("SELECIONE O LOTE")}
                    </Text>
                    <View style={styles.chipsContainer}>
                      {lotes.map((lote) => {
                        const selecionado = lote.id === loteVendaAdminId;
                        return (
                          <TouchableOpacity
                            key={lote.id}
                            style={[
                              styles.chip,
                              selecionado && styles.chipSelecionadoRose,
                            ]}
                            onPress={() => setLoteVendaAdminId(lote.id)}
                          >
                            <Text
                              style={[
                                styles.textoChip,
                                selecionado && styles.textoChipSelecionado,
                              ]}
                            >
                              {maiuscula(
                                `${lote.nome} (${lote.quantidade_disponivel} DISP.)`
                              )}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.labelCampo}>
                      {maiuscula("QUANTIDADE VENDIDA")}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={maiuscula("EX.: 3")}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={qtdVendaAdmin}
                      onChangeText={setQtdVendaAdmin}
                    />

                    <TouchableOpacity
                      style={[
                        styles.botaoRose,
                        processandoVendaAdmin && styles.botaoDesabilitado,
                      ]}
                      onPress={handleVendaAdmin}
                      disabled={processandoVendaAdmin}
                    >
                      <Text style={styles.textoBotao}>
                        {processandoVendaAdmin
                          ? maiuscula("REGISTRANDO VENDA...")
                          : maiuscula("REGISTRAR VENDA")}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.secao}>
                <Text style={styles.tituloSecao}>
                  {maiuscula("DETALHAMENTO DOS LOTES")}
                </Text>
                {lotes.length === 0 ? (
                  <Text style={styles.textoVazio}>
                    {maiuscula("NENHUM LOTE CADASTRADO AINDA.")}
                  </Text>
                ) : (
                  lotes.map((lote) => {
                    const paradoDoLote =
                      Number(lote.quantidade_disponivel) * Number(lote.preco);
                    const vendidosDoLote =
                      Number(lote.quantidade_inicial) -
                      Number(lote.quantidade_disponivel);

                    return (
                      <View key={lote.id} style={styles.itemLote}>
                        <View style={styles.itemTopo}>
                          <Text style={styles.nomeItem}>
                            {maiuscula(lote.nome)}
                          </Text>
                          <Text style={styles.precoBadge}>
                            R$ {Number(lote.preco).toFixed(2)}
                          </Text>
                        </View>
                        <Text style={styles.detalheItem}>
                          {maiuscula(
                            `VENDIDOS: ${vendidosDoLote} · DISPONÍVEIS: ${lote.quantidade_disponivel} / ${lote.quantidade_inicial}`
                          )}
                        </Text>
                        <Text style={styles.saldoLoteTexto}>
                          {maiuscula(
                            `SALDO PARADO NESTE LOTE: R$ ${paradoDoLote.toFixed(2)}`
                          )}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scroll: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  scrollCentralizado: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  conteudoCentral: {
    width: "100%",
    maxWidth: 860,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 8px 24px rgba(17, 24, 39, 0.04)" }
      : { elevation: 2 }),
  },
  headerLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  headerTextoColuna: {
    flex: 1,
    minWidth: 220,
  },
  badgeDourado: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF9E7",
    borderWidth: 1,
    borderColor: "#F3E5AB",
    color: "#9A7215",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeRose: {
    alignSelf: "flex-start",
    backgroundColor: "#FDF2EE",
    borderWidth: 1,
    borderColor: "#F5D0C5",
    color: "#B4533C",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitulo: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  botaoLateralAdmin: {
    backgroundColor: "#C59B27",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  botaoLateralSair: {
    backgroundColor: "#FDF2EE",
    borderWidth: 1,
    borderColor: "#E8C2B6",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  textoBotaoLateralSair: {
    color: "#9E4731",
    fontWeight: "800",
    fontSize: 13,
  },
  cardAuth: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 10px 28px rgba(17, 24, 39, 0.06)" }
      : { elevation: 3 }),
  },
  tituloAuth: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtituloAuth: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 18,
  },
  botaoSecundario: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  textoBotaoSecundario: {
    color: "#4B5563",
    fontWeight: "700",
    fontSize: 14,
  },
  avisoBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  avisoSucesso: {
    backgroundColor: "#FFFDF5",
    borderColor: "#E6D59C",
  },
  avisoErro: {
    backgroundColor: "#FDF2EE",
    borderColor: "#E8C2B6",
  },
  avisoTexto: {
    fontSize: 14,
    fontWeight: "600",
  },
  avisoTextoSucesso: {
    color: "#8A6510",
  },
  avisoTextoErro: {
    color: "#9E4731",
  },
  resumoLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  cardResumo: {
    flex: 1,
    minWidth: 240,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  cardArrecadado: {
    backgroundColor: "#FFFDF5",
    borderColor: "#E6D59C",
  },
  cardParado: {
    backgroundColor: "#FDF2EE",
    borderColor: "#E8C2B6",
  },
  labelArrecadado: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9A7215",
    letterSpacing: 0.5,
  },
  labelParado: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A84E37",
    letterSpacing: 0.5,
  },
  valorResumo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 6,
  },
  secao: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 6px 18px rgba(17, 24, 39, 0.03)" }
      : { elevation: 2 }),
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 14,
  },
  labelCampo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  linhaInputs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metade: {
    flex: 1,
    minWidth: 180,
  },
  boxPrevia: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F6EFE2",
    borderColor: "#E6D59C",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  labelPrevia: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  valorPrevia: {
    fontSize: 18,
    fontWeight: "800",
    color: "#9A7215",
  },
  botaoDourado: {
    backgroundColor: "#C59B27",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  botaoRose: {
    backgroundColor: "#D47A62",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  chipSelecionadoDourado: {
    backgroundColor: "#C59B27",
    borderColor: "#C59B27",
  },
  chipSelecionadoRose: {
    backgroundColor: "#D47A62",
    borderColor: "#D47A62",
  },
  chipEsgotado: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  textoChip: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  textoChipSelecionado: {
    color: "#FFFFFF",
  },
  textoChipEsgotado: {
    color: "#9CA3AF",
  },
  itemLote: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 14,
    marginTop: 14,
  },
  itemTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  nomeItem: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  precoBadge: {
    backgroundColor: "#FEF9E7",
    borderWidth: 1,
    borderColor: "#F3E5AB",
    color: "#9A7215",
    fontWeight: "700",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  detalheItem: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    color: "#374151",
    marginTop: 6,
  },
  saldoLoteTexto: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: "#A84E37",
    marginTop: 4,
  },
  textoVazio: {
    fontSize: 14,
    color: "#6B7280",
  },
});