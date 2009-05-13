<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" xmlns:str="http://exslt.org/strings"
    xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:jq="http://www.pauldyck.com/jquery"
    exclude-result-prefixes="data"
    extension-element-prefixes="exsl str set" version="1.0">
        
    <xsl:import href="/xslt/common.xsl" />
        
    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes" />
        
    <xsl:template match="/">
        <toc>
            <xsl:apply-templates select="//tei:div[not(@rend='analysis')]" />
        </toc>
    </xsl:template>

    <xsl:template match="tei:div">
      <tocentry>
          <xsl:attribute name="text">
              <xsl:value-of select="tei:head" />
              <xsl:if test="tei:lg[1]/tei:l[1]">
                  <xsl:text> - </xsl:text>
                  <xsl:value-of select="tei:lg[1]/tei:l[1]" />
              </xsl:if>
          </xsl:attribute>
          <xsl:attribute name="id">
            <xsl:apply-templates select="." mode="id" />
          </xsl:attribute>
          <xsl:attribute name="n">
              <xsl:apply-templates select="." mode="n" />
          </xsl:attribute>
          <xsl:attribute name="parentID">
              <xsl:apply-templates select="ancestor::tei:div[1]" mode="id" />
          </xsl:attribute>
      </tocentry>
    </xsl:template>
</xsl:stylesheet>
