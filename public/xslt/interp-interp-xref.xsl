<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml"
  xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
  xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/"
  xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
  exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

  <xsl:import href="/xslt/common.xsl"/>
  <xsl:output method="html" encoding="UTF-8" version="1.0" indent="yes"/>

  <!-- This is the key for picking out ana's, which can be multi-valued, so we tokenize -->
  <xsl:key name="ana" match="//*[@ana]" use="str:tokenize(@ana,'# ')"/>

  <xsl:template match="/">
    <div class="names">
      <table>
        <tr>
          <td>Interp</td>
          <xsl:for-each select="//tei:interp">
              <td>
                <xsl:value-of select="." />
              </td>
          </xsl:for-each>
        </tr>
        <xsl:apply-templates
          select="//tei:interp" mode="crossref"
        />
      </table>
    </div>
  </xsl:template>

  <xsl:template match="tei:interp" mode="crossref">
    <xsl:variable name="rows">
      <tr>
        <td>
          <xsl:value-of select="." />
        </td>
        <xsl:variable name="interpKey" select="@xml:id" />
        <xsl:for-each select="//tei:interp">
        <td>
          <xsl:value-of select="count(set:intersection(key('ana', @xml:id), key('ana', $interpKey))) " />
        </td>
          </xsl:for-each>
      </tr>
    </xsl:variable>
    <xsl:apply-templates select="exsl:node-set($rows)/xhtml:tr[count(xhtml:td[position() &gt; 1][string(.) != '0']) &gt; 0]">
    </xsl:apply-templates>
  </xsl:template>
  
    <xsl:template match="xhtml:tr">
      <xsl:copy-of select="." />
    </xsl:template>
</xsl:stylesheet>
