(function () {
  "use strict";

  var currentLanguage = "en";

  var translations = {
    en: {
      actionsTitle: "Actions",
      appEyebrow: "iptables helper",
      appTitle: "iptables command generator",
      commandTitle: "Command",
      copied: "Copied",
      copyFailed: "Copy failed",
      copyTitle: "Copy command",
      customServicePortRequired: "Custom service port is required",
      fieldsAttention: "Some fields need attention",
      fillRequired: "# Fill in the required fields",
      invalidPort: "Invalid port format",
      languageLabel: "Language",
      required: "Required",
      requiredField: "{field} is required",
      resetTitle: "Reset values",
      scenarioNavLabel: "iptables scenarios",
      tcpUdpRequired: "Ports require tcp or udp",
      updated: "Command updated",
      workspaceLabel: "Generator"
    },
    it: {
      actionsTitle: "Azioni",
      appEyebrow: "iptables helper",
      appTitle: "Generatore comandi iptables",
      commandTitle: "Comando",
      copied: "Copiato",
      copyFailed: "Copia non riuscita",
      copyTitle: "Copia comando",
      customServicePortRequired: "La porta del servizio personalizzato e richiesta",
      fieldsAttention: "Ci sono campi da completare",
      fillRequired: "# Completa i campi richiesti",
      invalidPort: "Formato porta non valido",
      languageLabel: "Lingua",
      required: "Richiesto",
      requiredField: "{field} richiesto",
      resetTitle: "Ripristina valori",
      scenarioNavLabel: "Scenari iptables",
      tcpUdpRequired: "Le porte richiedono tcp o udp",
      updated: "Comando aggiornato",
      workspaceLabel: "Generatore"
    }
  };

  var commonFields = [
    selectField("sudo", text("Administrator privileges", "Permessi amministratore"), "sudo", [
      ["sudo", text("Use sudo", "Usa sudo")],
      ["", text("Already root / no sudo", "Gia root / senza sudo")]
    ]),
    selectField("binary", text("IP family", "Famiglia IP"), "iptables", [
      ["iptables", text("IPv4", "IPv4")],
      ["ip6tables", text("IPv6", "IPv6")]
    ])
  ];

  var trafficFlowOptions = [
    ["INPUT", text("Incoming traffic to this machine", "Traffico in ingresso su questa macchina")],
    ["OUTPUT", text("Outgoing traffic from this machine", "Traffico in uscita da questa macchina")],
    ["FORWARD", text("Traffic routed through this machine", "Traffico instradato attraverso questa macchina")]
  ];

  var routedTrafficOptions = [
    ["INPUT", text("Incoming traffic to this machine", "Traffico in ingresso su questa macchina")],
    ["FORWARD", text("Traffic routed through this machine", "Traffico instradato attraverso questa macchina")]
  ];

  var tableOptions = [
    ["filter", text("Firewall rules", "Regole firewall")],
    ["nat", text("NAT and port forwarding", "NAT e port forwarding")],
    ["mangle", text("Packet changes", "Modifiche pacchetti")],
    ["raw", text("Early packet handling", "Gestione pacchetti iniziale")],
    ["security", text("Security labels", "Etichette sicurezza")]
  ];

  var chainOptions = [
    ["", text("Everything in this rule group", "Tutto in questo gruppo regole")],
    ["INPUT", text("Incoming traffic", "Traffico in ingresso")],
    ["OUTPUT", text("Outgoing traffic", "Traffico in uscita")],
    ["FORWARD", text("Routed traffic", "Traffico instradato")],
    ["PREROUTING", text("Before routing", "Prima del routing")],
    ["POSTROUTING", text("After routing", "Dopo il routing")]
  ];

  var serviceOptions = [
    ["tcp:22", "SSH"],
    ["tcp:80", "HTTP"],
    ["tcp:443", "HTTPS"],
    ["udp:53", "DNS UDP"],
    ["tcp:53", "DNS TCP"],
    ["tcp:25", "SMTP"],
    ["tcp:587", "SMTP submission"],
    ["tcp:993", "IMAPS"],
    ["tcp:3306", "MySQL"],
    ["tcp:5432", "PostgreSQL"],
    ["tcp:6379", "Redis"],
    ["tcp:3389", "RDP"],
    ["custom", text("Custom service", "Servizio personalizzato")]
  ];

  var scenarios = [
    {
      id: "allow-port",
      label: text("Allow a service", "Consenti servizio"),
      icon: "+",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Adds an ACCEPT rule for traffic that reaches a specific TCP or UDP port.",
            "Aggiunge una regola ACCEPT per il traffico che arriva su una porta TCP o UDP specifica."
          )
        ),
        helpBlock(text("Key choices", "Scelte importanti"), [
          text("Incoming means clients connect to this machine.", "In ingresso significa che i client si collegano a questa macchina."),
          text("Outgoing means this machine starts the connection.", "In uscita significa che questa macchina avvia la connessione."),
          text("Routed means this machine is acting as a gateway.", "Instradato significa che questa macchina fa da gateway.")
        ]),
        helpBlock(
          text("Before running", "Prima di eseguire"),
          text(
            "Make sure a stricter rule earlier in the list is not already dropping the same traffic.",
            "Assicurati che una regola piu restrittiva precedente nella lista non stia gia scartando lo stesso traffico."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("trafficFlow", text("Traffic direction", "Direzione traffico"), "INPUT", trafficFlowOptions),
        selectField("service", text("Service to allow", "Servizio da consentire"), "tcp:80", serviceOptions),
        visibleWhen(selectField("customProtocol", text("Custom service protocol", "Protocollo servizio personalizzato"), "tcp", ["tcp", "udp"]), "service", "custom"),
        visibleWhen(inputField("customPort", text("Custom service port", "Porta servizio personalizzato"), "", false, text("Choose the port number or range", "Scegli numero porta o intervallo")), "service", "custom"),
        inputField("source", text("Allow only from", "Consenti solo da"), "", false, text("Optional IP or network, for example 10.0.0.5/32", "IP o rete opzionale, per esempio 10.0.0.5/32")),
        inputField("destination", text("Only when destination is", "Solo quando la destinazione e"), "", false, text("Optional IP or network", "IP o rete opzionale")),
        inputField("inInterface", text("Arriving on interface", "In arrivo su interfaccia"), "", false, "eth0"),
        inputField("outInterface", text("Leaving on interface", "In uscita da interfaccia"), "", false, "eth1"),
        selectField("state", text("Connection type", "Tipo connessione"), "", [
          ["", text("Any matching traffic", "Qualsiasi traffico corrispondente")],
          ["NEW", text("New connections only", "Solo nuove connessioni")],
          ["NEW,ESTABLISHED", text("New and already open connections", "Connessioni nuove e gia aperte")]
        ]),
        inputField("comment", text("Rule note", "Nota regola"), "", false, text("Optional text stored with the rule", "Testo opzionale salvato con la regola"), true)
      ]),
      build: function (v) {
        var service = resolveService(v.service, v.customProtocol, v.customPort);
        return [
          buildRule(v, ["-A", v.trafficFlow], [
            ["-p", service.protocol],
            ["-s", v.source],
            ["-d", v.destination],
            ["-i", v.inInterface],
            ["-o", v.outInterface],
            ["--dport", service.port],
            conntrack(v.state),
            comment(v.comment),
            ["-j", "ACCEPT"]
          ])
        ];
      }
    },
    {
      id: "block-port",
      label: text("Block a service", "Blocca servizio"),
      icon: "x",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Adds a rule that stops traffic aimed at a specific TCP or UDP port.",
            "Aggiunge una regola che ferma il traffico diretto a una porta TCP o UDP specifica."
          )
        ),
        helpBlock(text("DROP or REJECT", "DROP o REJECT"), [
          text("DROP silently discards packets.", "DROP scarta i pacchetti senza rispondere."),
          text("REJECT refuses the traffic and sends an error back.", "REJECT rifiuta il traffico e invia un errore al mittente.")
        ]),
        helpBlock(
          text("Before running", "Prima di eseguire"),
          text(
            "Rule order matters: if an ACCEPT rule appears first, this rule may never be reached.",
            "L'ordine conta: se prima c'e una regola ACCEPT, questa regola potrebbe non essere mai raggiunta."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("trafficFlow", text("Traffic direction", "Direzione traffico"), "INPUT", trafficFlowOptions),
        selectField("service", text("Service to block", "Servizio da bloccare"), "tcp:22", serviceOptions),
        visibleWhen(selectField("customProtocol", text("Custom service protocol", "Protocollo servizio personalizzato"), "tcp", ["tcp", "udp"]), "service", "custom"),
        visibleWhen(inputField("customPort", text("Custom service port", "Porta servizio personalizzato"), "", false, text("Choose the port number or range", "Scegli numero porta o intervallo")), "service", "custom"),
        inputField("source", text("Block only from", "Blocca solo da"), "", false, text("Optional IP or network", "IP o rete opzionale")),
        inputField("inInterface", text("Arriving on interface", "In arrivo su interfaccia"), "", false, "eth0"),
        selectField("target", text("How to block", "Come bloccare"), "DROP", [
          ["DROP", text("Silently drop it", "Scarta senza rispondere")],
          ["REJECT", text("Reject with an error", "Rifiuta con errore")]
        ]),
        inputField("comment", text("Rule note", "Nota regola"), "", false, text("Optional", "Opzionale"), true)
      ]),
      build: function (v) {
        var service = resolveService(v.service, v.customProtocol, v.customPort);
        return [
          buildRule(v, ["-A", v.trafficFlow], [
            ["-p", service.protocol],
            ["-s", v.source],
            ["-i", v.inInterface],
            ["--dport", service.port],
            comment(v.comment),
            ["-j", v.target]
          ])
        ];
      }
    },
    {
      id: "allow-established",
      label: text("Allow established traffic", "Consenti traffico stabilito"),
      icon: "=",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Allows packets that belong to an existing connection or to a related connection.",
            "Consente i pacchetti che appartengono a una connessione gia esistente o correlata."
          )
        ),
        helpBlock(text("Why it is useful", "Perche e utile"), [
          text("A web request goes out, then the response has to come back in.", "Una richiesta web esce, poi la risposta deve poter rientrare."),
          text("This rule is often placed before more restrictive rules.", "Questa regola viene spesso messa prima delle regole piu restrittive.")
        ]),
        helpBlock(
          text("Behind the scenes", "Dietro le quinte"),
          text(
            "-m conntrack loads the connection tracking match, and --ctstate chooses the allowed states.",
            "-m conntrack carica il controllo stato connessione, e --ctstate sceglie gli stati permessi."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("trafficFlow", text("Traffic direction", "Direzione traffico"), "INPUT", trafficFlowOptions),
        inputField("inInterface", text("Arriving on interface", "In arrivo su interfaccia"), "", false, text("Optional", "Opzionale")),
        inputField("outInterface", text("Leaving on interface", "In uscita da interfaccia"), "", false, text("Optional", "Opzionale")),
        inputField("comment", text("Rule note", "Nota regola"), "allow established", false, text("Optional", "Opzionale"), true)
      ]),
      build: function (v) {
        return [
          buildRule(v, ["-A", v.trafficFlow], [
            ["-i", v.inInterface],
            ["-o", v.outInterface],
            conntrack("ESTABLISHED,RELATED"),
            comment(v.comment),
            ["-j", "ACCEPT"]
          ])
        ];
      }
    },
    {
      id: "drop-source",
      label: text("Block a source", "Blocca sorgente"),
      icon: "-",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Drops or rejects packets coming from a specific IP address or network.",
            "Scarta o rifiuta i pacchetti che arrivano da un indirizzo IP o da una rete specifica."
          )
        ),
        helpBlock(text("Source format", "Formato sorgente"), [
          text("Use /32 for a single IPv4 host, for example 203.0.113.10/32.", "Usa /32 per un singolo host IPv4, per esempio 203.0.113.10/32."),
          text("Use a network CIDR to block a whole subnet.", "Usa un CIDR di rete per bloccare una sottorete intera.")
        ]),
        helpBlock(
          text("Before running", "Prima di eseguire"),
          text(
            "Check that you are not blocking your own management address.",
            "Controlla di non bloccare il tuo indirizzo di amministrazione."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("trafficFlow", text("Where to block it", "Dove bloccarlo"), "INPUT", routedTrafficOptions),
        inputField("source", text("IP or network to block", "IP o rete da bloccare"), "203.0.113.10", true, text("For example 203.0.113.10 or 203.0.113.0/24", "Per esempio 203.0.113.10 o 203.0.113.0/24")),
        inputField("inInterface", text("Arriving on interface", "In arrivo su interfaccia"), "", false, text("Optional", "Opzionale")),
        selectField("target", text("How to block", "Come bloccare"), "DROP", [
          ["DROP", text("Silently drop it", "Scarta senza rispondere")],
          ["REJECT", text("Reject with an error", "Rifiuta con errore")]
        ]),
        inputField("comment", text("Rule note", "Nota regola"), "", false, text("Optional", "Opzionale"), true)
      ]),
      build: function (v) {
        return [
          buildRule(v, ["-A", v.trafficFlow], [
            ["-s", v.source],
            ["-i", v.inInterface],
            comment(v.comment),
            ["-j", v.target]
          ])
        ];
      }
    },
    {
      id: "default-policy",
      label: text("Default firewall stance", "Comportamento firewall predefinito"),
      icon: "p",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Sets what happens when no rule in the selected traffic category matches a packet.",
            "Imposta cosa succede quando nessuna regola nella categoria di traffico selezionata corrisponde al pacchetto."
          )
        ),
        helpBlock(text("Safe order", "Ordine sicuro"), [
          text("Create the allow rules first, then make the default policy stricter.", "Crea prima le regole di allow, poi rendi piu restrittiva la policy di default."),
          text("Be especially careful before setting INPUT to DROP on a remote server.", "Fai particolare attenzione prima di impostare INPUT a DROP su un server remoto.")
        ]),
        helpBlock(
          text("Behind the scenes", "Dietro le quinte"),
          text("This changes the default behavior of a whole traffic category, not one single rule.", "Questo cambia il comportamento predefinito di una categoria di traffico intera, non una singola regola.")
        )
      ],
      fields: commonFields.concat([
        selectField("trafficFlow", text("Traffic category", "Categoria traffico"), "INPUT", trafficFlowOptions),
        selectField("policy", text("Default behavior", "Comportamento predefinito"), "DROP", [
          ["ACCEPT", text("Allow when no rule matches", "Consenti se nessuna regola corrisponde")],
          ["DROP", text("Block when no rule matches", "Blocca se nessuna regola corrisponde")]
        ])
      ]),
      build: function (v) {
        return [formatCommand(commandStart(v).concat(["-P", v.trafficFlow, v.policy]))];
      }
    },
    {
      id: "nat-masquerade",
      label: text("NAT masquerade", "NAT masquerade"),
      icon: "n",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Rewrites traffic from an internal network so it can leave through the WAN interface.",
            "Riscrive il traffico di una rete interna per farlo uscire dall'interfaccia WAN."
          )
        ),
        helpBlock(text("Typical use", "Uso tipico"), [
          text("A LAN uses a private subnet and reaches the internet through this host.", "Una LAN usa una subnet privata e raggiunge internet passando da questo host."),
          text("MASQUERADE is useful when the WAN address is dynamic.", "MASQUERADE e utile quando l'indirizzo WAN e dinamico.")
        ]),
        helpBlock(
          text("Before running", "Prima di eseguire"),
          text(
            "Linux IP forwarding must also be enabled for routing to work.",
            "Anche l'IP forwarding di Linux deve essere attivo per permettere il routing."
          )
        )
      ],
      fields: commonFields.concat([
        inputField("source", text("Internal network", "Rete interna"), "192.168.1.0/24", true, text("LAN CIDR", "CIDR della LAN")),
        inputField("outInterface", text("WAN interface", "Interfaccia WAN"), "eth0", true, text("For example eth0, ppp0, ens3", "Per esempio eth0, ppp0, ens3")),
        inputField("comment", text("Rule note", "Nota regola"), "lan masquerade", false, text("Optional", "Opzionale"), true)
      ]),
      build: function (v) {
        return [
          buildRule(v, ["-t", "nat", "-A", "POSTROUTING"], [
            ["-s", v.source],
            ["-o", v.outInterface],
            comment(v.comment),
            ["-j", "MASQUERADE"]
          ])
        ];
      }
    },
    {
      id: "port-forward",
      label: text("Port forwarding", "Port forwarding"),
      icon: ">",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Sends traffic arriving on a public port to a private host and port.",
            "Invia il traffico che arriva su una porta pubblica verso un host e una porta privati."
          )
        ),
        helpBlock(text("Generated commands", "Comandi generati"), [
          text("The PREROUTING rule performs DNAT, changing the destination.", "La regola PREROUTING fa DNAT, cambiando la destinazione."),
          text("The FORWARD rule allows the routed traffic to pass.", "La regola FORWARD consente al traffico instradato di passare.")
        ]),
        helpBlock(
          text("Before running", "Prima di eseguire"),
          text(
            "You usually also need NAT masquerade and Linux IP forwarding enabled.",
            "Di solito servono anche NAT masquerade e IP forwarding Linux attivo."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("service", text("Public service", "Servizio pubblico"), "tcp:80", serviceOptions),
        visibleWhen(selectField("customProtocol", text("Custom public protocol", "Protocollo pubblico personalizzato"), "tcp", ["tcp", "udp"]), "service", "custom"),
        visibleWhen(inputField("customPort", text("Custom public port", "Porta pubblica personalizzata"), "", false, text("Choose the public port number or range", "Scegli numero porta pubblica o intervallo")), "service", "custom"),
        inputField("inInterface", text("Internet-facing interface", "Interfaccia verso internet"), "eth0", true, "eth0"),
        inputField("destinationIp", text("Send traffic to internal host", "Invia traffico all'host interno"), "192.168.1.20", true, text("Internal IP address", "Indirizzo IP interno")),
        inputField("destinationPort", text("Internal host port", "Porta host interno"), "80", true, text("Port on the internal machine", "Porta sulla macchina interna")),
        inputField("source", text("Accept only from", "Accetta solo da"), "", false, text("Optional IP or network", "IP o rete opzionale")),
        inputField("comment", text("Rule note", "Nota regola"), "port forward", false, text("Optional", "Opzionale"), true)
      ]),
      build: function (v) {
        var service = resolveService(v.service, v.customProtocol, v.customPort);
        return [
          buildRule(v, ["-t", "nat", "-A", "PREROUTING"], [
            ["-p", service.protocol],
            ["-i", v.inInterface],
            ["-s", v.source],
            ["--dport", service.port],
            comment(v.comment),
            ["-j", "DNAT"],
            ["--to-destination", v.destinationIp + ":" + v.destinationPort]
          ]),
          buildRule(v, ["-A", "FORWARD"], [
            ["-p", service.protocol],
            ["-d", v.destinationIp],
            ["--dport", v.destinationPort],
            conntrack("NEW,ESTABLISHED,RELATED"),
            ["-j", "ACCEPT"]
          ])
        ];
      }
    },
    {
      id: "list-rules",
      label: text("List rules", "Lista regole"),
      icon: "#",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Shows the rules currently loaded in the selected rule group and traffic area.",
            "Mostra le regole attualmente caricate nel gruppo regole e nell'area traffico selezionati."
          )
        ),
        helpBlock(text("Useful flags", "Opzioni utili"), [
          text("-n avoids DNS lookups and keeps output fast.", "-n evita risoluzioni DNS e mantiene l'output veloce."),
          text("-v adds counters and interfaces.", "-v aggiunge contatori e interfacce."),
          text("--line-numbers helps you delete a rule by number.", "--line-numbers aiuta a cancellare una regola tramite numero.")
        ]),
        helpBlock(
          text("Tip", "Suggerimento"),
          text(
            "Use the same table here that you plan to edit later.",
            "Usa qui la stessa tabella che vuoi modificare dopo."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("table", text("Rule group", "Gruppo regole"), "filter", tableOptions),
        selectField("chain", text("What to show", "Cosa mostrare"), "", chainOptions),
        selectField("verbose", text("Output detail", "Dettaglio output"), "-n -v --line-numbers", [
          ["-n", text("Fast numeric view", "Vista numerica veloce")],
          ["-n -v", text("Show counters too", "Mostra anche i contatori")],
          ["-n -v --line-numbers", text("Show counters and rule numbers", "Mostra contatori e numeri regola")]
        ])
      ]),
      build: function (v) {
        var tokens = commandStart(v).concat(["-t", v.table, "-L"]);
        if (v.chain) {
          tokens.push(v.chain);
        }
        tokens = tokens.concat(v.verbose.split(" "));
        return [formatCommand(tokens)];
      }
    },
    {
      id: "delete-rule",
      label: text("Remove by rule number", "Rimuovi tramite numero regola"),
      icon: "d",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Deletes one rule by line number from the selected rule group and traffic area.",
            "Cancella una regola tramite numero riga dal gruppo regole e dall'area traffico selezionati."
          )
        ),
        helpBlock(text("Important", "Importante"), [
          text("Line numbers change after each deletion.", "I numeri riga cambiano dopo ogni cancellazione."),
          text("List the rules with line numbers immediately before deleting.", "Lista le regole con i numeri subito prima di cancellare.")
        ]),
        helpBlock(
          text("Behind the scenes", "Dietro le quinte"),
          text("The generated command removes the rule from the exact area you selected.", "Il comando generato rimuove la regola dall'area esatta che hai selezionato.")
        )
      ],
      fields: commonFields.concat([
        selectField("table", text("Rule group", "Gruppo regole"), "filter", tableOptions),
        selectField("chain", text("Where the rule is", "Dove si trova la regola"), "INPUT", chainOptions.slice(1)),
        inputField("ruleNumber", text("Rule number to remove", "Numero regola da rimuovere"), "1", true, text("Use the number shown by List rules", "Usa il numero mostrato da Lista regole"))
      ]),
      build: function (v) {
        return [
          formatCommand(commandStart(v).concat(["-t", v.table, "-D", v.chain, v.ruleNumber]))
        ];
      }
    },
    {
      id: "flush",
      label: text("Clear rules", "Svuota regole"),
      icon: "f",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Removes rules from one traffic area, or from the whole selected rule group if no area is chosen.",
            "Rimuove le regole da un'area traffico, o da tutto il gruppo regole selezionato se non scegli un'area."
          )
        ),
        helpBlock(text("Important", "Importante"), [
          text("Flush does not change default policies.", "Flush non cambia le policy di default."),
          text("On a remote server, flushing INPUT can cut active access if policies are strict.", "Su un server remoto, fare flush di INPUT puo interrompere l'accesso se le policy sono restrittive.")
        ]),
        helpBlock(
          text("Behind the scenes", "Dietro le quinte"),
          text("The generated command clears rules but leaves the default behavior unchanged.", "Il comando generato svuota le regole ma lascia invariato il comportamento predefinito.")
        )
      ],
      fields: commonFields.concat([
        selectField("table", text("Rule group", "Gruppo regole"), "filter", tableOptions),
        selectField("chain", text("Rules to clear", "Regole da svuotare"), "", chainOptions)
      ]),
      build: function (v) {
        var tokens = commandStart(v).concat(["-t", v.table, "-F"]);
        if (v.chain) {
          tokens.push(v.chain);
        }
        return [formatCommand(tokens)];
      }
    },
    {
      id: "custom-rule",
      label: text("Advanced builder", "Builder avanzato"),
      icon: "*",
      help: [
        helpBlock(
          text("What it does", "Cosa fa"),
          text(
            "Builds a general rule when none of the guided scenarios matches exactly.",
            "Compone una regola generica quando nessuno degli scenari guidati e perfetto."
          )
        ),
        helpBlock(text("Command flow", "Flusso del comando"), [
          text("Choose the rule group, placement, traffic area, conditions, and final action.", "Scegli gruppo regole, posizione, area traffico, condizioni e azione finale."),
          text("Leave unused fields empty to omit them from the command.", "Lascia vuoti i campi inutili per escluderli dal comando.")
        ]),
        helpBlock(
          text("Tip", "Suggerimento"),
          text(
            "Use this for learning, then prefer a specific scenario when it fits.",
            "Usala per imparare, poi preferisci uno scenario specifico quando va bene."
          )
        )
      ],
      fields: commonFields.concat([
        selectField("table", text("Rule group", "Gruppo regole"), "filter", tableOptions),
        selectField("operation", text("Where to place the rule", "Dove inserire la regola"), "-A", [
          ["-A", text("At the end", "Alla fine")],
          ["-I", text("At a specific position", "In una posizione specifica")]
        ]),
        inputField("position", text("Position number", "Numero posizione"), "", false, text("Only used when placing at a specific position", "Usato solo quando inserisci in una posizione specifica")),
        selectField("chain", text("Traffic area", "Area traffico"), "INPUT", chainOptions.slice(1)),
        selectField("protocol", text("Network protocol", "Protocollo di rete"), "", [
          ["", text("Any protocol", "Qualsiasi protocollo")],
          "tcp",
          "udp",
          "icmp"
        ]),
        inputField("source", text("Only from", "Solo da"), "", false, text("Optional IP or network", "IP o rete opzionale")),
        inputField("destination", text("Only to", "Solo verso"), "", false, text("Optional IP or network", "IP o rete opzionale")),
        inputField("inInterface", text("Arriving on interface", "In arrivo su interfaccia"), "", false, text("Optional", "Opzionale")),
        inputField("outInterface", text("Leaving on interface", "In uscita da interfaccia"), "", false, text("Optional", "Opzionale")),
        inputField("sourcePort", text("Only from source port", "Solo da porta sorgente"), "", false, text("Requires tcp or udp", "Richiede tcp o udp")),
        inputField("destinationPort", text("Only to destination port", "Solo verso porta destinazione"), "", false, text("Requires tcp or udp", "Richiede tcp o udp")),
        selectField("target", text("What to do", "Cosa fare"), "ACCEPT", [
          ["ACCEPT", text("Allow it", "Consenti")],
          ["DROP", text("Silently drop it", "Scarta senza rispondere")],
          ["REJECT", text("Reject with an error", "Rifiuta con errore")],
          ["LOG", text("Log it", "Scrivi nel log")],
          ["MASQUERADE", text("Masquerade it", "Masquerade")]
        ]),
        inputField("comment", text("Rule note", "Nota regola"), "", false, text("Optional", "Opzionale"), true)
      ]),
      build: function (v) {
        var operation = [v.operation, v.chain];
        if (v.operation === "-I" && v.position) {
          operation.push(v.position);
        }
        return [
          buildRule(v, ["-t", v.table].concat(operation), [
            ["-p", v.protocol],
            ["-s", v.source],
            ["-d", v.destination],
            ["-i", v.inInterface],
            ["-o", v.outInterface],
            ["--sport", v.sourcePort],
            ["--dport", v.destinationPort],
            comment(v.comment),
            ["-j", v.target]
          ])
        ];
      }
    }
  ];

  var state = {
    scenarioId: scenarios[0].id,
    values: {}
  };

  var scenarioList = document.getElementById("scenarioList");
  var scenarioTitle = document.getElementById("scenarioTitle");
  var fieldGrid = document.getElementById("fieldGrid");
  var output = document.getElementById("commandOutput");
  var notesBox = document.getElementById("notesBox");
  var messageBox = document.getElementById("messageBox");
  var resetButton = document.getElementById("resetButton");
  var copyButton = document.getElementById("copyButton");
  var form = document.getElementById("commandForm");
  var languageSelect = document.getElementById("languageSelect");

  applyStaticTexts();
  renderScenarioList();
  activateScenario(state.scenarioId);

  languageSelect.addEventListener("change", function () {
    currentLanguage = languageSelect.value;
    applyStaticTexts();
    renderScenarioList();
    activateScenario(state.scenarioId);
  });

  resetButton.addEventListener("click", function () {
    activateScenario(state.scenarioId, true);
  });

  copyButton.addEventListener("click", function () {
    var command = output.textContent.trim();
    if (!command || hasErrors()) {
      setMessage(translateKey("fieldsAttention"), true);
      return;
    }
    copyText(command);
  });

  form.addEventListener("input", handleInput);
  form.addEventListener("change", handleInput);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  function text(en, it) {
    return {
      en: en,
      it: it || en
    };
  }

  function inputField(id, label, defaultValue, required, hint, wide) {
    return {
      id: id,
      label: label,
      type: "input",
      defaultValue: defaultValue,
      required: Boolean(required),
      hint: hint || "",
      wide: Boolean(wide)
    };
  }

  function selectField(id, label, defaultValue, options) {
    return {
      id: id,
      label: label,
      type: "select",
      defaultValue: defaultValue,
      options: options.map(function (option) {
        if (Array.isArray(option)) {
          return {
            value: option[0],
            label: option.length > 1 ? option[1] : option[0]
          };
        }
        return {
          value: option,
          label: option
        };
      })
    };
  }

  function visibleWhen(field, dependency, value) {
    field.visibleWhen = {
      dependency: dependency,
      value: value
    };
    return field;
  }

  function helpBlock(title, body) {
    return {
      title: title,
      body: Array.isArray(body) ? body : [body]
    };
  }

  function applyStaticTexts() {
    document.documentElement.lang = currentLanguage;
    languageSelect.value = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = translateKey(element.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (element) {
      element.dataset.i18nAttr.split(",").forEach(function (pair) {
        var parts = pair.split(":");
        element.setAttribute(parts[0], translateKey(parts[1]));
      });
    });
  }

  function renderScenarioList() {
    scenarioList.innerHTML = "";
    scenarios.forEach(function (scenario) {
      var button = document.createElement("button");
      button.className = "scenario-button";
      button.type = "button";
      button.dataset.scenarioId = scenario.id;
      button.innerHTML =
        '<span class="scenario-icon" aria-hidden="true">' +
        escapeHtml(scenario.icon) +
        "</span><span>" +
        escapeHtml(translate(scenario.label)) +
        "</span>";
      button.addEventListener("click", function () {
        activateScenario(scenario.id);
      });
      scenarioList.appendChild(button);
    });
  }

  function activateScenario(id, resetValues) {
    var scenario = getScenario(id);
    state.scenarioId = id;
    state.values[id] = resetValues ? {} : state.values[id] || {};

    scenarioList.querySelectorAll(".scenario-button").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.scenarioId === id);
    });

    scenarioTitle.textContent = translate(scenario.label);
    renderFields(scenario);
    renderHelp(scenario);
    updateOutput();
  }

  function renderFields(scenario) {
    fieldGrid.innerHTML = "";
    scenario.fields.forEach(function (field) {
      var value = getValue(scenario.id, field);
      var wrapper = document.createElement("div");
      wrapper.className =
        "field" +
        (field.wide ? " is-wide" : "") +
        (isFieldVisible(scenario, field) ? "" : " is-hidden");
      wrapper.dataset.field = field.id;

      var label = document.createElement("label");
      label.setAttribute("for", field.id);
      label.textContent = translate(field.label);

      var control = field.type === "select" ? document.createElement("select") : document.createElement("input");
      control.id = field.id;
      control.name = field.id;
      control.dataset.field = field.id;

      if (field.type === "select") {
        field.options.forEach(function (option) {
          var opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = translate(option.label);
          control.appendChild(opt);
        });
        control.value = value;
      } else {
        control.type = "text";
        control.value = value;
        control.placeholder = field.defaultValue || "";
      }

      var hint = document.createElement("small");
      hint.textContent = field.required ? translateKey("required") : translate(field.hint);

      wrapper.appendChild(label);
      wrapper.appendChild(control);
      wrapper.appendChild(hint);
      fieldGrid.appendChild(wrapper);
    });
  }

  function isFieldVisible(scenario, field) {
    if (!field.visibleWhen) {
      return true;
    }
    var dependency = scenario.fields.find(function (candidate) {
      return candidate.id === field.visibleWhen.dependency;
    });
    if (!dependency) {
      return true;
    }
    return getValue(scenario.id, dependency) === field.visibleWhen.value;
  }

  function controlsVisibility(scenario, fieldId) {
    return scenario.fields.some(function (field) {
      return field.visibleWhen && field.visibleWhen.dependency === fieldId;
    });
  }

  function renderHelp(scenario) {
    notesBox.innerHTML = "";
    scenario.help.forEach(function (block) {
      var section = document.createElement("section");
      section.className = "notes-section";

      var heading = document.createElement("h3");
      heading.textContent = translate(block.title);
      section.appendChild(heading);

      if (block.body.length === 1) {
        var paragraph = document.createElement("p");
        paragraph.textContent = translate(block.body[0]);
        section.appendChild(paragraph);
      } else {
        var list = document.createElement("ul");
        block.body.forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = translate(item);
          list.appendChild(li);
        });
        section.appendChild(list);
      }

      notesBox.appendChild(section);
    });
  }

  function handleInput(event) {
    var control = event.target;
    if (!control.dataset.field) {
      return;
    }
    var scenario = getScenario(state.scenarioId);
    state.values[scenario.id][control.dataset.field] = control.value.trim();
    if (controlsVisibility(scenario, control.dataset.field)) {
      renderFields(scenario);
    }
    updateOutput();
  }

  function updateOutput() {
    var scenario = getScenario(state.scenarioId);
    var values = collectValues(scenario);
    var errors = validate(scenario, values);

    clearFieldErrors();
    errors.forEach(function (error) {
      setFieldError(error.field, error.message);
    });

    if (errors.length) {
      output.textContent = translateKey("fillRequired");
      setMessage(errors.length === 1 ? errors[0].message : translateKey("fieldsAttention"), true);
      return;
    }

    output.textContent = scenario.build(values).join("\n");
    setMessage(translateKey("updated"), false);
  }

  function collectValues(scenario) {
    var values = {};
    scenario.fields.forEach(function (field) {
      values[field.id] = getValue(scenario.id, field);
    });
    return values;
  }

  function validate(scenario, values) {
    var errors = [];
    scenario.fields.forEach(function (field) {
      if (field.required && !values[field.id]) {
        errors.push({
          field: field.id,
          message: interpolate(translateKey("requiredField"), {
            field: translate(field.label)
          })
        });
      }
    });

    ["destinationPort", "sourcePort"].forEach(function (fieldId) {
      if (values[fieldId] && !isPortExpression(values[fieldId])) {
        errors.push({
          field: fieldId,
          message: translateKey("invalidPort")
        });
      }
    });

    if (values.service === "custom" && values.customPort && !isPortExpression(values.customPort)) {
      errors.push({
        field: "customPort",
        message: translateKey("invalidPort")
      });
    }

    if (values.service === "custom" && !values.customPort) {
      errors.push({
        field: "customPort",
        message: translateKey("customServicePortRequired")
      });
    }

    if (scenario.id === "custom-rule") {
      if ((values.sourcePort || values.destinationPort) && ["tcp", "udp"].indexOf(values.protocol) === -1) {
        errors.push({
          field: "protocol",
          message: translateKey("tcpUdpRequired")
        });
      }
    }

    return errors;
  }

  function clearFieldErrors() {
    fieldGrid.querySelectorAll(".field").forEach(function (wrapper) {
      wrapper.classList.remove("has-error");
      var field = findField(wrapper.dataset.field);
      var hint = wrapper.querySelector("small");
      hint.textContent = field && field.required ? translateKey("required") : field ? translate(field.hint) : "";
    });
  }

  function setFieldError(fieldId, message) {
    var wrapper = fieldGrid.querySelector('[data-field="' + cssEscape(fieldId) + '"]');
    if (!wrapper) {
      return;
    }
    wrapper.classList.add("has-error");
    wrapper.querySelector("small").textContent = message;
  }

  function setMessage(message, warning) {
    messageBox.textContent = message;
    messageBox.classList.toggle("is-warning", Boolean(warning));
  }

  function hasErrors() {
    return fieldGrid.querySelector(".has-error") !== null;
  }

  function getScenario(id) {
    return scenarios.find(function (scenario) {
      return scenario.id === id;
    });
  }

  function findField(fieldId) {
    var scenario = getScenario(state.scenarioId);
    return scenario.fields.find(function (field) {
      return field.id === fieldId;
    });
  }

  function getValue(scenarioId, field) {
    var values = state.values[scenarioId] || {};
    if (Object.prototype.hasOwnProperty.call(values, field.id)) {
      return values[field.id];
    }
    return field.defaultValue || "";
  }

  function buildRule(values, operation, parts) {
    var tokens = commandStart(values).concat(operation);
    parts.forEach(function (part) {
      if (!part) {
        return;
      }
      if (Array.isArray(part[0])) {
        part.forEach(function (nested) {
          appendPart(tokens, nested);
        });
        return;
      }
      appendPart(tokens, part);
    });
    return formatCommand(tokens);
  }

  function appendPart(tokens, part) {
    if (!part || part.length === 0) {
      return;
    }
    if (part.length === 1) {
      if (part[0]) {
        tokens.push(part[0]);
      }
      return;
    }
    if (part[1]) {
      tokens.push(part[0], part[1]);
    }
  }

  function commandStart(values) {
    var tokens = [];
    if (values.sudo) {
      tokens.push(values.sudo);
    }
    tokens.push(values.binary || "iptables");
    return tokens;
  }

  function resolveService(serviceValue, customProtocol, customPort) {
    if (serviceValue === "custom") {
      return {
        protocol: customProtocol || "tcp",
        port: customPort
      };
    }
    var parts = String(serviceValue || "tcp:80").split(":");
    return {
      protocol: parts[0],
      port: parts[1]
    };
  }

  function conntrack(stateValue) {
    if (!stateValue) {
      return null;
    }
    return [
      ["-m", "conntrack"],
      ["--ctstate", stateValue]
    ];
  }

  function comment(value) {
    if (!value) {
      return null;
    }
    return [
      ["-m", "comment"],
      ["--comment", value]
    ];
  }

  function formatCommand(tokens) {
    return tokens.filter(Boolean).map(shellQuote).join(" ");
  }

  function shellQuote(token) {
    var value = String(token);
    if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) {
      return value;
    }
    return "'" + value.replace(/'/g, "'\"'\"'") + "'";
  }

  function isPortExpression(value) {
    return /^(\d{1,5})(:(\d{1,5}))?$/.test(value) && value.split(":").every(function (part) {
      var port = Number(part);
      return port >= 1 && port <= 65535;
    });
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(function () {
        setMessage(translateKey("copied"), false);
      }).catch(function () {
        fallbackCopy(value);
      });
      return;
    }
    fallbackCopy(value);
  }

  function fallbackCopy(value) {
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setMessage(translateKey("copied"), false);
    } catch (error) {
      setMessage(translateKey("copyFailed"), true);
    }
    document.body.removeChild(textarea);
  }

  function translate(value) {
    if (!value || typeof value !== "object") {
      return value || "";
    }
    return value[currentLanguage] || value.en || "";
  }

  function translateKey(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
  }

  function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : "";
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/"/g, '\\"');
  }
})();
