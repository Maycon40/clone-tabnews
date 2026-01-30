import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

export default StatusPage;

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Última atualização: {updatedAtText}</div>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let maxConnectionsText = "";
  let usedConnectionsText = "";
  let versionText = "";

  if (!isLoading && data) {
    const { database } = data.dependencies;
    maxConnectionsText = `${database.max_connections} conexões`;
    usedConnectionsText = `${database.used_connections} ${database.used_connections > 1 ? "conexões" : "conexão"}`;
    versionText = `${database.version}`;
  }

  return (
    <div>
      <p>Banco de dados:</p>
      <p>Versão: {versionText}</p>
      <p>Número de conexões: {usedConnectionsText}</p>
      <p>Número máximo de conexões: {maxConnectionsText}</p>
    </div>
  );
}
