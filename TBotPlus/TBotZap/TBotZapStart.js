const { default: makeWASocket, useMultiFileAuthState, MessageRetryMap, Presence, DisconnectReason, delay}  = require('@adiwajshing/baileys')

const { TBotZapNLP  } = require("./TBotZapFunction/TBotZapNLP")
const { TBotZapFreeAccount } = require('./TBotZapFunction/TBotZapFreeAccount')
const {TBotZapLoginTest} = require('./TBotZapClass/TBotZapCreateTest')
const { QRcode} = require('./TBotZapClass/TBotZapQrcode')
const { TBotZapSendLogin } = require('./TBotZapClass/TBotZapSendLogin')
const { TBotZapDBStatus } = require('./TBotZapFunction/TBotZapDatabaseStatus')
const {TBotZapSendAccountSSH} = require('./TBotZapClass/TBotZapSendAccountSSH')
const {TWABotFirstLoginTime, TWABotFileExist, TWABotLinkMediafire, TWABotLinkPlayStore, TWABotLoginLimit, TWABotLinkSupport, TWABotFirsLoginPrice, TWABotOpenFile} = require('./Util/TBotZapData')
const fs = require('fs')
const P = require('pino')
const path = require('path')
const TBotZapData = require('./Util/TBotZapData')

var msgRetryCounterMap = {};

async function TBotZap(){
   
        const { state, saveCreds } = await useMultiFileAuthState('/etc/TerminusBot/TBotZap/auth_info_baileys')
        const conn = makeWASocket({
            logger: P({ level: 'silent' }),
                printQRInTerminal: true,
                auth: state,
                msgRetryCounterMap: MessageRetryMap,
                defaultQueryTimeoutMs: undefined, 
                keepAliveIntervalMs: 1000 * 60 * 10 * 3

        })
    
        conn.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update
            if(connection === 'close') {
                const shouldReconnect = lastDisconnect.output !== DisconnectReason.loggedOut
                console.log('connection closed due to '+ lastDisconnect.output)
                // reconnect if not logged out
                if(shouldReconnect) {
                    TBotZap()
                }
            } else if(connection === 'open') {
                console.log('opened connection')
                TBotZapNLP.train()
                
            }

        })
 
        conn.ev.on("creds.update", saveCreds);
        conn.ev.on('messages.upsert', async (message) => {
            console.log(JSON.stringify(message, undefined, 2));
            let jid = message.messages[0].key.remoteJid
            if(message && !jid.endsWith("@g.us") && message.messages[0].message){
                    
               
                const reply =  message.messages[0]
                var msg = message.messages[0].message.conversation
                const key = message.messages[0].key 
                const user= message.messages[0].pushName
                let isGroup = false
                jid.endsWith("@g.us") ? isGroup = true : isGroup = false
                  
                    console.log(JSON.stringify(message.messages[0].key))
                if(msg){
                    TBotZapNLP.answer(msg.toLowerCase())
                    .then( async (answer) => {
                        switch(answer.intent){
                            case "SAUDACAO.RECEPCAO":
                                const welcomeMessage = {
                                    text: `
*BEM VINDO AO CANAL DE AUTO ATENDIMENTO START NET*

✅ CONEÇOES SSH PREMIUM - 30 DIAS ONLINE
        
✅ NAVEGAÇÃO ILIMITADA - SEM REDUÇÃO DURANTE ${TWABotFirstLoginTime()} DIAS
        
✅ FACA SEU TESTE GRÁTIS - VOCE PODE CRIAR SEU TESTE GRATUITO.
        
✅ TRABALHE CONOSCO SEJA UM *REVENDEDOR* E TENHA SUA RENDA EXTRA! 
        
✅ DOWNLOAD APLICATIVO - BAIXA NOSSO APLICATIVO DA PLAY STORE.
        
✅ SUPORTE, ENTRE EM CONTATO PELO WHATSSAPP *(65) 98473-9398.*
        
📍 SEMPRE REALIZE UM TESTE ANTES DA CONTRATAÇÃO!
AO REALIZAR O TESTE, ADQUIRA O LOGIN.`,
                                    footer: '⚡ Auto-Bot *Start Net* ⚡',
                                    buttons:  [
                                        {buttonId: 'continuar', buttonText: {displayText: 'Continuar'}, type: 1},
                                        {buttonId: 'sair', buttonText: {displayText: 'Sair'}, type: 1},
                                      ],
                                    headerType: 1
                                }
                            
                                delay(500)
                    
                                await conn.readMessages([key])
                                await delay(500)
                                        await conn.sendMessage(jid, welcomeMessage)

                              
                            break
                            case "INTENCAO.CONTAS":
                                await conn.readMessages([key])
                                delay(500)
                                let userId
                                isGroup ? userId = message.messages[0].key.participant : userId = jid
                                if(TWABotFileExist({path: '/etc/TerminusBot/TBotZap/usuarios/account_recovery.json'})){
                        
                                    fs.readFile('/etc/TerminusBot/TBotZap/usuarios/account_recovery.json', {encoding: 'utf-8'}, async (error, data) => {
                                      if(error == null){
                                        const pedido_json = JSON.parse(data)
                                        if(pedido_json.length > 0){
                                          const userExist = pedido_json.find(findEl => findEl.chat_id == userId)
                                          if(userExist != undefined){
                                            var account_list = ''
                                            for(var i in pedido_json){
                                                if(pedido_json[i].chat_id.includes(userId)){
                                                    await conn.sendPresenceUpdate('composing', userId)
                                                    await delay(100)
                                                    await conn.sendMessage(userId, {text:  `
*CONTA CRIADA COM SUCESSO!*
*Usuário:* ${pedido_json[i].ssh_account}
*Senha:* ${pedido_json[i].ssh_password}
*Expira:* ${pedido_json[i].ssh_expire}
*Limite:* ${pedido_json[i].ssh_limit}
*Pedido:* ${pedido_json[i].order_id}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
Link de download
PlayStore: ${TWABotLinkPlayStore()}
MediaFire: ${TWABotLinkMediafire()}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
OBRIGADO POR ADQUIRIR NOSSO PRODUTO.`
                                                    })
                                              
                                                }
                                            }
                                          }else{
                                            await conn.sendPresenceUpdate('composing', jid)
                                            await delay(100)
                                            await conn.sendMessage(jid, {text: '*AINDA NÃO CONFIRMAMOS O SEU PAGAMENTO. AGUARDE A CONFIRMAÇÃO DO PIX E SERA GERADO SEU *USUARIO E SENHA*.*'})
                                          }
                                
                                           
                                        }else {
                                        
                                            await conn.sendPresenceUpdate('composing', jid)
                                            await delay(100)
                                            await conn.sendMessage(jid, {text: 'AINDA NÃO CONFIRMAMOS O SEU PAGAMENTO. AGUARDE A CONFIRMAÇÃO DO PIX E SERA GERADO SEU *USUARIO E SENHA*.'})
                                        }
                                      }
                                      
                                    })
                                   
                                }else{
                                    await conn.readMessages([key])
                                    await delay(500)
                                    await conn.sendPresenceUpdate('composing', jid)
                                    await delay(100)
                                    await conn.sendMessage(jid, {text: 'AINDA NÃO CONFIRMAMOS O SEU PAGAMENTO. AGUARDE A CONFIRMAÇÃO DO PIX E SERA GERADO SEU *USUARIO E SENHA*.'})
                                }
                            break

                        }



                        
                    })
                }

                if(message.messages[0].message.buttonsResponseMessage != null ){

                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "continuar"){
                        const buttons = [
                            {buttonId: 'comprar_acesso', buttonText: {displayText: 'COMPRAR ACESSO SSH'}, type: 1},
                            {buttonId: 'teste_gratis', buttonText: {displayText: 'CRIAR TESTE GRÁTIS'}, type: 1},
                            {buttonId: 'verificar_pagamento', buttonText: {displayText: 'VERIFICAR PAGAMENTO'}, type: 1},
                        ]
                    
                        const buttonListMessage = {
                            text: "*"+user+"*veja as opções*",
                            footer: 'by: https://t.me/START_NET_OFICIAL ',
                            buttons: buttons,
                            headerType: 1
                        }

                        await conn.readMessages([key])
                        await delay(500)
                        await conn.sendPresenceUpdate('composing', jid)
                        await delay(500)
                        await conn.sendMessage(jid, buttonListMessage)
                    }
 
                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "comprar_acesso"){
                        const buttons = [
                            {buttonId: 'comprar', buttonText: {displayText: 'Comprar'}, type: 1},
                            {buttonId: 'cancelar', buttonText: {displayText: 'Cancelar'}, type: 1},
                          ]
                    
                        const buttonAccounOne ={ 
                    text: `
📌  DETALHES DA COMPRA 📌

👜 *PRODUTO:* ACESSO VPN (INTERNET ILIMITADA)

💰 *PREÇO:* ${TWABotFirsLoginPrice()} REAIS.

📅 *VALIDADE:* ${TWABotFirstLoginTime()} DIAS.

👤 *USUÁRIOS:* ${TWABotLoginLimit()} USUÁRIO`,
                    footer: '⚡ Auto-Bot *Start Net* ⚡',
                    buttons: buttons,
                    headerType: 1
                    
                        }
                    

                        await conn.readMessages([key])
                        await conn.sendPresenceUpdate('composing', jid)
                        await delay(500)
                        await conn.sendMessage(jid, buttonAccounOne)
                    }



                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "teste_gratis"){
                        
                        await conn.readMessages([key])
                        await conn.sendPresenceUpdate('composing', jid)
                        await delay(500)
                        await conn.sendMessage(jid, {text: "*SÓ UM MOMENTO ESTOU GERANDO O SEU TESTE GRÁTIS*"})

                        TBotZapFreeAccount(isGroup ? message.messages[0].key.participant : jid)
                        .then(async (response) => {
                            if(response.status){

                                const buttons = [
                                    {buttonId: 'btn_playstore', buttonText: {displayText: 'Play Store'}, type: 1},
                                    {buttonId: 'btn_mediafire', buttonText: {displayText: 'Mediafire'}, type: 1},
                                  ]
                            
                                const buttonAccounOne ={ 
                            text: response.payload,
                            footer: 'PARA BAIXAR NOSSO APP ESCOLHA UMA DAS OPCÕES.',
                            buttons: buttons,
                            headerType: 1
                            
                                }

                                await delay(500)
                                await conn.sendPresenceUpdate('composing', isGroup ? message.messages[0].key.participant : jid)
                                await delay(500)
                                await conn.sendMessage(isGroup ? message.messages[0].key.participant : jid, buttonAccounOne)
                            }else{
                                await delay(500)
                                await conn.sendPresenceUpdate('composing', jid)
                                await delay(500)
                                await conn.sendMessage(jid, {text:"😟😟 *VOCÊ JÁ ESGOTOU SEU LIMITE DE TESTE GRÁTIS. MAS NÃO FIQUE SEM INTERNET, APROVEITE 30 DIAS POR APENAS 20,00 SEM FIDELIDADE !.*"}, {quoted: reply})
                            
                            }
                        })
                    }

                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "suporte_cliente"){
                   
                        await conn.readMessages([key])
                        delay(500)
                        const link_support = "ENVIE UMA MENSAGEM PELO LINK: "+TWABotLinkSupport()
                        await delay(500)
                        await conn.sendMessage(jid, {text: link_support})

                       
                    }

                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "verificar_pagamento"){
                        await conn.readMessages([key])
                        await delay(500)

                        if(TWABotFileExist({path: '/etc/TerminusBot/TBotZap/usuarios/account_recovery.json'})){
                        
                            fs.readFile('/etc/TerminusBot/TBotZap/usuarios/account_recovery.json', {encoding: 'utf-8'}, async (error, data) => {
                              if(error == null){
                                const pedido_json = JSON.parse(data)
                                if(pedido_json.length > 0){
                                  const userExist = pedido_json.find(findEl => findEl.chat_id == jid)
                                  if(userExist != undefined){
                                    var account_list = ''
                                    for(var i in pedido_json){
                                        if(pedido_json[i].chat_id.includes(jid)){
                                            await conn.sendPresenceUpdate('composing', jid)
                                            await delay(100)
                                            await conn.sendMessage(jid, {text:  `
CONTA CRIADA COM SUCESSO!
*Usuário:* ${pedido_json[i].ssh_account}
*Senha:* ${pedido_json[i].ssh_password}
*Expira:* ${pedido_json[i].ssh_expire}
*Limite:* ${pedido_json[i].ssh_limit}
*Pedido:* ${pedido_json[i].order_id}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
LINK DE DOWNLOAD
PlayStore: ${TWABotLinkPlayStore()}
MediaFire: ${TWABotLinkMediafire()}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
OBRIGADO POR ADQUIRIR NOSSO PRODUTO. FIQUE ATENTO AO *USUARIO E SENHA* DEVE COLOCAR IGUAL NO APLICATIVO`
                                            })
                                      
                                        }
                                    }
                                  }else{
                                    await conn.sendPresenceUpdate('composing', jid)
                                    await delay(100)
                                    await conn.sendMessage(jid, {text: '*AINDA NÃO CONFIRMAMOS O SEU PAGAMENTO. AGUARDE A CONFIRMAÇÃO DO PIX E SERA GERADO SEU *USUARIO E SENHA*.'})
                                  }
                        
                                   
                                }else {
                                
                                    await conn.sendPresenceUpdate('composing', jid)
                                    await delay(100)
                                    await conn.sendMessage(jid, {text: 'AINDA NÃO CONFIRMAMOS O SEU PAGAMENTO. AGUARDE A CONFIRMAÇÃO DO PIX E SERA GERADO SEU *USUARIO E SENHA*.'})
                                }
                              }
                              
                            })
                           
                        }else{
                            await conn.readMessages([key])
                            await delay(500)
                            await conn.sendPresenceUpdate('composing', jid)
                            await delay(100)
                            await conn.sendMessage(jid, {text: 'AINDA NÃO CONFIRMAMOS O SEU PAGAMENTO. AGUARDE A CONFIRMAÇÃO DO PIX E SERA GERADO SEU *USUARIO E SENHA*.'})
                        }

                    }


                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "btn_playstore"){
                   
                        await conn.readMessages([key])
                        delay(500)
                        await delay(100)
                        await conn.sendPresenceUpdate('composing', jid)
                        const link_playstore = "BAIXE NOSSO APLICATIVO PELA PLAY STORE POR ESTE LINK: "+TWABotLinkPlayStore()
                        await delay(500)
                        await conn.sendMessage(jid, {text:link_playstore})
                       
                    }
    
                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "btn_mediafire"){
                       
                        await conn.readMessages([key])
                        delay(500)
                        const link_mediafire = "BAIXE NOSSO APLICATIVO PELA PLAY STORE POR ESTE LINK: "+TWABotLinkMediafire()
                        await delay(500)
                        await conn.sendMessage(jid, {text: link_mediafire})
                       
                    }
        
                    if(message.messages[0].message.buttonsResponseMessage.selectedButtonId == "comprar"){
                        
                        QRcode.generate({chatId: isGroup ? message.messages[0].key.participant : jid})
                        .then(async (payload) => {
                            console.log(payload)
                            await delay(100)
                            await conn.sendPresenceUpdate('composing', payload.chat)
                            await delay(100)
                            await conn.sendMessage(jid, {text: "*SÓ UM MOMENTO ESTOU GERANDO O QRCODE.*"})
                            await delay(500)
                            if(payload.status){
                                await delay(500)
                                await conn.sendPresenceUpdate('composing', payload.chat)
                                await delay(200)
                                await conn.sendMessage(jid, {text: `${payload.qrCode}`})
                            }
                            await delay(100)
                            await conn.sendPresenceUpdate('composing', payload.chat)
                            await conn.sendMessage(jid, {text: `*GUARDE O SEU NÚMERO DO PEDIDO:* ${payload.orderId}`})
                            await conn.sendPresenceUpdate('composing', jid)
                            await delay(100)
                            await conn.sendMessage(jid, {text: "O QRCODE FOI GERADO. ASSIM QUE CONFIRMARMOS O PAGAMENTO, VOCÊ RECEBERÁ O SEU LOGIN. *OU SE PREFERIR DIGITE: _NÃO RECEBI A MINHA CONTA_*"})
                           
                        })
                    
                    }
                }


            }
        })
 

}
     

TBotZap()
