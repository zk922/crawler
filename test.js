(async function(){let LianjiaCrawler = require('./src/crawlers/lianjia')
                  let c = new LianjiaCrawler;
                  let sendData = `重庆cq:      `;
                        let total;
                        try{
                          total = (await c.getCityLoupanTotal('cq')).data.total;
                        }
                        catch (e) {
                          console.log(`获取重庆新房数量失败   `, e);
                        }

                        console.log(`新房数量    `, total || 0);
                        // console.log(v.cityName, total);
                        if(!total){
                          sendData += '共0套\n';
                        }
                        else{
                          sendData += `共${total}套\n`;

                          //TODO 需要对超过100页的房源按区域抓取。
                          if(total <= 1000){
                            for(let i=0; i*10<total; i++){
                              let listData;
                              try {
                                listData = (await c.getCityLoupanPerpage('cq', i+1)).data;
                              }
                              catch (e) {
                                return e;
                              }
                              console.log(`${v.cityName}(${v.alias})第${listData.page}页获取成功`);
                              let str = `第${listData.page}页：\n`;
                              listData.list.forEach(v=>{
                                str += `   ${v.address}     ${v.show_price_info}\n`;
                              });
                              sendData += str;
                            }
                          }
                          else if(total > 1000){
                            let sections;
                            let cityAlias = 'cq';
                            let cityName = '重庆';
                            try{
                              // console.log('超过1000000', cityAlias);
                              sections = (await c.getDistrictSection(cityAlias)).data;
                              // console.log('超过1000000', sections);
                              // process.exit(111);
                            }
                            catch (e) {
                              return e
                            }

                            await sections.district.forEach(function (v, i, a) {
                             for(let i=0; i<v.section.length; i++){
                                           (async function (v) {
                                             let sectionTotal;
                                             try{
                                               sectionTotal = (await c.getCityLoupanTotal(cityAlias, v.sectionAlias)).data.total;
                                             }
                                             catch (e) {
                                               console.log(`获取${cityName} ${v.sectionName}新房数量失败   `, e);
                                             }

                                             console.log(`${cityName}(${cityAlias})  ${v.sectionName}新房数量    `, sectionTotal || 0);
                                             // console.log(v.cityName, total);
                                             if(!sectionTotal){
                                               sendData += `${v.sectionName}（${v.sectionAlias}）新房数量  共0套\n`;
                                             }
                                             else {
                                               sendData += `${v.sectionName}（${v.sectionAlias}）新房数量  共${sectionTotal}套\n`;
                                               if(sectionTotal>0){
                                                 for(let i=0; i*10<sectionTotal; i++){
                                                   let listData;
                                                   try {
                                                     listData = (await c.getCityLoupanPerpage(cityAlias, i+1, v.sectionAlias)).data;
                                                   }
                                                   catch (e) {
                                                     return e;
                                                   }
                                                   let str = `第${listData.page}页：\n`;
                                                   listData.list.forEach(v=>{
                                                     str += `   ${v.address}     ${v.show_price_info}\n`;
                                                   });
                                                   sendData += str;
                                                 }
                                               }
                                             }
                                           })(v.section[i])
                                         }

                            )
                          }
                        }
                        sendData += '--------------------------------------------------\n';

                        console.log(sendData)

                        })()