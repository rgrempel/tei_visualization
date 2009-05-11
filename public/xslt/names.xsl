<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" xmlns:str="http://exslt.org/strings"
  xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/" xmlns:tei="http://www.tei-c.org/ns/1.0"
  xmlns:jq="http://www.pauldyck.com/jquery" exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

  <xsl:import href="/xslt/common.xsl" />

  <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes" />

  <xsl:key name="namesByKey" match="tei:name" use="@key" />

  <xsl:template match="/">
    <pd:names>
      <!-- I want to sort by a computed value, which would be simple if I had functions, but I don't.
           So I'll create an intermediate result and sort that -->
      <xsl:variable name="names">
        <xsl:apply-templates select="//tei:name[generate-id(.) = generate-id(key('namesByKey', @key))]" />
      </xsl:variable>
      <xsl:for-each select="exsl:node-set($names)/*">
        <xsl:sort select="@text" />
        <xsl:copy-of select="." />
      </xsl:for-each>
    </pd:names>
  </xsl:template>

  <xsl:template match="tei:name">
    <pd:name id="{@key}" key="{@key}" type="{@type}">
      <xsl:attribute name="text">
        <xsl:apply-templates select="." mode="canonical" />
      </xsl:attribute>
    </pd:name>
  </xsl:template>
</xsl:stylesheet>
