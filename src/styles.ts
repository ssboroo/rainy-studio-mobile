import { StyleSheet } from "react-native";
export const C = {
 bg:"#080A0E",panel:"#14171D",panel2:"#1B2028",text:"#F7F8FB",muted:"#919AA8",
 outline:"#303744",yellow:"#FFE500",green:"#B7FF4A",teal:"#73F2E5",danger:"#FF7777",
};
export const S = StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},container:{paddingHorizontal:20,paddingTop:10,paddingBottom:28},
 eyebrow:{color:C.muted,fontSize:11,fontWeight:"800",letterSpacing:2,marginBottom:8},
 h1:{color:C.text,fontSize:32,lineHeight:38,fontWeight:"900",letterSpacing:-.7},
 h2:{color:C.text,fontSize:22,fontWeight:"800",marginBottom:12},
 body:{color:"#C1C8D1",fontSize:14,lineHeight:22},
 caption:{color:C.muted,fontSize:12,lineHeight:18},
 card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.outline,borderRadius:23,padding:18},
 input:{backgroundColor:C.panel2,borderWidth:1,borderColor:C.outline,borderRadius:16,padding:14,fontSize:15,color:C.text,textAlignVertical:"top"},
 chip:{borderWidth:1,borderColor:C.outline,backgroundColor:C.panel,borderRadius:20,paddingHorizontal:14,paddingVertical:10,marginRight:7,marginBottom:9},
 chipActive:{borderColor:C.yellow,backgroundColor:"#3D3918"},
 chipText:{color:C.muted,fontWeight:"700",fontSize:12},
 chipTextActive:{color:C.yellow},
 action:{backgroundColor:C.yellow,borderRadius:16,minHeight:52,alignItems:"center",justifyContent:"center",paddingHorizontal:18},
 actionText:{color:"#101015",fontWeight:"900",fontSize:14},
 secondary:{backgroundColor:C.panel2,borderRadius:15,minHeight:46,alignItems:"center",justifyContent:"center",paddingHorizontal:15,borderWidth:1,borderColor:C.outline},
 secondaryText:{color:C.text,fontWeight:"700",fontSize:13}
});
